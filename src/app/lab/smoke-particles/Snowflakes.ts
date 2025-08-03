import { InstancedMesh, PlaneGeometry, SRGBColorSpace, TextureLoader, Vector3 } from 'three';
import {
    Fn,
    If,
    ShaderNodeObject,
    deltaTime,
    float,
    hash,
    instanceIndex,
    storage,
    time,
    uniform,
    vec3,
} from 'three/tsl';
import {
    ComputeNode,
    SpriteNodeMaterial,
    StorageBufferNode,
    StorageInstancedBufferAttribute,
    WebGPURenderer,
} from 'three/webgpu';
import { Pane } from 'tweakpane';
import { simplexNoise3d } from '@/utils/webgpu/nodes/noise/simplexNoise3d';
import BaseExperience from '../BaseExperience';

type Parameters = {
    amount: number;
    renderer: WebGPURenderer;
    viewport: BaseExperience['viewport'];
};

class Snowflakes extends InstancedMesh<PlaneGeometry, SpriteNodeMaterial> {
    renderer: Parameters['renderer'];
    amount: Parameters['amount'];
    viewport: Parameters['viewport'];

    buffers: {
        startPositions: ShaderNodeObject<StorageBufferNode>;
        positions: ShaderNodeObject<StorageBufferNode>;
        velocities: ShaderNodeObject<StorageBufferNode>;
        masses: ShaderNodeObject<StorageBufferNode>;
        sizes: ShaderNodeObject<StorageBufferNode>;
    };

    updateCompute: ComputeNode;

    windTime = 0;

    params = {
        gravity: 0.098,
        friction: 0.99,
        wind: new Vector3(0.2, 0, 0),
    };

    uniforms = {
        gravity: uniform(this.params.gravity),
        friction: uniform(this.params.friction),
        wind: uniform(this.params.wind),
    };

    constructor({ amount, renderer, viewport }: Parameters) {
        const snowflakeTexture = new TextureLoader().load('/img/snowflake.webp');
        snowflakeTexture.colorSpace = SRGBColorSpace;

        const geometry = new PlaneGeometry();
        const material = new SpriteNodeMaterial({
            transparent: true,
            depthWrite: false,
            sizeAttenuation: true,
            map: snowflakeTexture,
            alphaTest: 0.5,
        });

        super(geometry, material, amount);

        this.frustumCulled = false;
        this.renderer = renderer;
        this.amount = amount;
        this.viewport = viewport;

        this.buffers = {
            startPositions: storage(new StorageInstancedBufferAttribute(this.amount, 3), 'vec3', this.amount).setPBO(
                true,
            ),
            positions: storage(new StorageInstancedBufferAttribute(this.amount, 3), 'vec3', this.amount).setPBO(true),
            velocities: storage(new StorageInstancedBufferAttribute(this.amount, 3), 'vec3', this.amount).setPBO(true),
            masses: storage(new StorageInstancedBufferAttribute(this.amount, 1), 'float', this.amount).setPBO(true),
            sizes: storage(new StorageInstancedBufferAttribute(this.amount, 1), 'float', this.amount).setPBO(true),
        };

        material.positionNode = this.buffers.positions.element(instanceIndex);

        material.scaleNode = this.buffers.sizes.element(instanceIndex);

        material.rotationNode = hash(instanceIndex).mul(time).mul(this.uniforms.wind.x);

        const initCompute = Fn(() => {
            this.buffers.startPositions.element(instanceIndex).assign(
                vec3(
                    hash(instanceIndex)
                        .sub(0.5)
                        .mul(this.viewport.width * 3),
                    hash(instanceIndex.add(1))
                        .mul(30)
                        .add(this.viewport.top * 3),
                    hash(instanceIndex.add(2)).negate().mul(20),
                ),
            );
            this.buffers.positions.element(instanceIndex).assign(this.buffers.startPositions.element(instanceIndex));
            this.buffers.velocities.element(instanceIndex).assign(vec3(0));
            this.buffers.masses.element(instanceIndex).assign(float(0.8).add(hash(instanceIndex).mul(0.2)));
            this.buffers.sizes.element(instanceIndex).assign(float(0.03).add(hash(instanceIndex).mul(0.03)));
        })().compute(this.amount);

        this.renderer.computeAsync(initCompute).then(() => {
            initCompute.dispose();
        });

        this.updateCompute = Fn(() => {
            /**
             * Read from buffers
             */

            const position = this.buffers.positions.element(instanceIndex);
            const velocity = this.buffers.velocities.element(instanceIndex);
            const respawnPos = this.buffers.startPositions.element(instanceIndex);
            const mass = this.buffers.masses.element(instanceIndex);

            const newPosition = position.toVar('newPosition');
            const newVelocity = velocity.toVar('newVelocity');

            const clampedDeltaTime = deltaTime.min(0.02).toVar('clampedDeltaTime');

            /**
             * Wind
             */

            const windDirection = this.uniforms.wind.normalize();
            // const wind = this.uniforms.wind.add(simplexNoise3d(position).mul(this.uniforms.wind.length()));
            const wind = this.uniforms.wind.div(mass);
            // .mul(curlNoise4d(vec4(position, time)).mul(windDirection))
            // .mul(simplexNoise3d(position).mul(windDirection));
            // .mul(0);

            /**
             * Velocity
             */

            // newVelocity.addAssign(this.uniforms.wind.div(mass));
            newVelocity.addAssign(wind);
            newVelocity.xz.addAssign(simplexNoise3d(position).mul(0.1));
            newVelocity.mulAssign(this.uniforms.friction);
            newVelocity.y.subAssign(this.uniforms.gravity.mul(10));
            newVelocity.mulAssign(clampedDeltaTime);

            /**
             * Position
             */

            newPosition.addAssign(newVelocity);

            /**
             * Life
             */

            If(newPosition.y.lessThan(this.viewport.bottom * 5), () => {
                newPosition.assign(respawnPos);
                newVelocity.assign(vec3(0));
            });

            /**
             * Write to buffers
             */

            position.assign(newPosition);
            velocity.assign(newVelocity);
        })().compute(this.amount);
    }

    /**
     * Update the simulation by one frame.
     * @param {number} delta The time in seconds since the last frame.
     */
    update(delta = 1 / 60) {
        this.windTime += delta;
        const wx = Math.sin(this.windTime * 0.5) * 0.3 + Math.cos(this.windTime * 0.2) * 0.1;
        const wy = -Math.abs(Math.sin(this.windTime * 0.23)) * 0.1;
        const wz = Math.cos(this.windTime * 0.13) * 0.1;
        this.uniforms.wind.value.set(wx, wy, wz);

        this.renderer.computeAsync(this.updateCompute);
    }

    /**
     * Disposes of the mesh and its resources.
     */
    dispose() {
        Object.values(this.buffers).forEach((buffer) => {
            if (Array.isArray(buffer)) {
                buffer.forEach((buffer) => buffer.dispose());
            } else {
                buffer.dispose();
            }
        });

        Object.values(this.uniforms).forEach((uniform) => {
            uniform.dispose();
        });

        this.updateCompute.dispose();
        this.geometry.dispose();
        this.material.dispose();
        super.dispose();

        return this;
    }

    /**
     * Initializes the tweak pane for the particles.
     * @param {Pane} tweakPane - The pane to add the folder to.
     */
    initTweakPane(tweakPane: Pane) {
        const folder = tweakPane.addFolder({ title: 'Particles' });

        folder.addBinding(this.params, 'gravity', { min: 0, max: 3, step: 0.001 }).on('change', () => {
            this.uniforms.gravity.value = this.params.gravity;
        });
        folder.addBinding(this.params, 'friction', { min: 0, max: 1, step: 0.001 }).on('change', () => {
            this.uniforms.friction.value = this.params.friction;
        });
        folder.addBinding(this.params, 'wind', { min: -10, max: 10, step: 0.01 }).on('change', () => {
            this.uniforms.wind.value.copy(this.params.wind);
        });
        // folder.addBinding(this, 'amount', { min: 0, max: 30000, step: 1 }).on('change', () => {
        //     this.dispose();
        //     this.constructor({ amount: this.amount, renderer: this.renderer, viewport: this.viewport });
        // });
    }
}

export default Snowflakes;
