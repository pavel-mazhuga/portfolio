import { AdditiveBlending, Color, InstancedMesh, PlaneGeometry, Vector3 } from 'three';
import {
    Fn,
    If,
    ShaderNodeObject,
    add,
    deltaTime,
    float,
    hash,
    instanceIndex,
    min,
    mul,
    rand,
    select,
    storage,
    time,
    uniform,
    uniformArray,
    uv,
    vec3,
    vec4,
} from 'three/tsl';
import {
    ComputeNode,
    SpriteNodeMaterial,
    StorageBufferNode,
    StorageInstancedBufferAttribute,
    UniformNode,
    WebGPURenderer,
} from 'three/webgpu';
import { Pane } from 'tweakpane';
import { curlNoise4d } from '@/utils/webgpu/nodes/noise/curlNoise4d';
import { simplexNoise3d } from '@/utils/webgpu/nodes/noise/simplexNoise3d';

type Parameters = {
    amount: number;
    startPositions: number[] | ShaderNodeObject<StorageBufferNode>;
    renderer: WebGPURenderer;
    pointerPosition: ShaderNodeObject<UniformNode<Vector3>>;
    pointerVelocity: ShaderNodeObject<UniformNode<Vector3>>;
};

class ParticlesMesh extends InstancedMesh<PlaneGeometry, SpriteNodeMaterial> {
    renderer: Parameters['renderer'];
    amount: Parameters['amount'];
    pointerPosition: Parameters['pointerPosition'];
    pointerVelocity: Parameters['pointerVelocity'];

    buffers: {
        startPositions?: ShaderNodeObject<StorageBufferNode>;
        positions?: ShaderNodeObject<StorageBufferNode>;
        velocities?: ShaderNodeObject<StorageBufferNode>;
        lifes?: ShaderNodeObject<StorageBufferNode>;
        masses?: ShaderNodeObject<StorageBufferNode>;
        sizes?: ShaderNodeObject<StorageBufferNode>;
    } = {};

    updateCompute: ComputeNode;

    tweakPane?: Pane;

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

    constructor({ amount, pointerPosition, pointerVelocity, startPositions, renderer }: Parameters) {
        const geometry = new PlaneGeometry();
        const material = new SpriteNodeMaterial({
            transparent: true,
            depthWrite: false,
            sizeAttenuation: true,
            // blending: AdditiveBlending,
        });

        super(geometry, material, amount);

        this.frustumCulled = false;
        this.renderer = renderer;
        this.amount = amount;
        this.pointerPosition = pointerPosition;
        this.pointerVelocity = pointerVelocity;

        this.buffers.startPositions = Array.isArray(startPositions)
            ? storage(
                  new StorageInstancedBufferAttribute(new Float32Array(startPositions), 3),
                  'vec3',
                  this.amount,
              ).setPBO(true)
            : startPositions;

        this.buffers.positions = storage(
            new StorageInstancedBufferAttribute(this.amount, 3),
            'vec3',
            this.amount,
        ).setPBO(true);

        this.buffers.velocities = storage(
            new StorageInstancedBufferAttribute(this.amount, 3),
            'vec3',
            this.amount,
        ).setPBO(true);

        this.buffers.lifes = storage(new StorageInstancedBufferAttribute(this.amount, 1), 'float', this.amount).setPBO(
            true,
        );

        this.buffers.masses = storage(new StorageInstancedBufferAttribute(this.amount, 1), 'float', this.amount).setPBO(
            true,
        );

        this.buffers.sizes = storage(new StorageInstancedBufferAttribute(this.amount, 1), 'float', this.amount).setPBO(
            true,
        );

        material.positionNode = this.buffers.positions.element(instanceIndex);

        material.scaleNode = this.buffers.sizes!.element(instanceIndex);

        material.colorNode = Fn(() => {
            const life = this.buffers.lifes!.element(instanceIndex);
            const alpha = min(life.smoothstep(0, 0.3), life.smoothstep(0.7, 1).oneMinus());

            uv().sub(0.5).length().greaterThan(0.5).discard();

            return vec4(1, 1, 1, alpha);
        })();

        const generateLifeDuration = () => hash(instanceIndex.add(time)).mul(0.8).add(0.7);

        const initCompute = Fn(() => {
            this.buffers.positions?.element(instanceIndex).assign(this.buffers.startPositions!.element(instanceIndex));
            this.buffers.velocities?.element(instanceIndex).assign(vec3(0));
            this.buffers.lifes?.element(instanceIndex).assign(-1);
            this.buffers.masses?.element(instanceIndex).assign(float(0.8).add(hash(instanceIndex).mul(0.2)));
            this.buffers.sizes?.element(instanceIndex).assign(float(0.02).add(hash(instanceIndex).mul(0.02)));
        })().compute(this.amount);

        this.renderer.computeAsync(initCompute);

        this.updateCompute = Fn(() => {
            const position = this.buffers.positions!.element(instanceIndex);
            const velocity = this.buffers.velocities!.element(instanceIndex);
            const respawnPos = this.buffers.startPositions!.element(instanceIndex);
            const life = this.buffers.lifes!.element(instanceIndex);
            const mass = this.buffers.masses!.element(instanceIndex);

            const newPosition = position.toVar('newPosition');
            const newVelocity = velocity.toVar('newVelocity');
            const newLife = life.toVar('newLife');

            const clampedDeltaTime = deltaTime.min(0.02).toVar('clampedDeltaTime');

            const windDirection = this.uniforms.wind.normalize();
            // const wind = this.uniforms.wind.add(simplexNoise3d(position).mul(this.uniforms.wind.length()));
            const wind = this.uniforms.wind.div(mass);
            // .mul(curlNoise4d(vec4(position, time)).mul(windDirection))
            // .mul(simplexNoise3d(position).mul(windDirection));
            // .mul(0);

            // newVelocity.addAssign(this.uniforms.wind.div(mass));
            newVelocity.addAssign(wind);
            newVelocity.mulAssign(this.uniforms.friction);
            newVelocity.y.subAssign(this.uniforms.gravity);
            newVelocity.mulAssign(clampedDeltaTime);

            newPosition.addAssign(newVelocity);

            newLife.subAssign(clampedDeltaTime.mul(0.1));

            If(newLife.lessThanEqual(0), () => {
                newPosition.assign(respawnPos);
                newVelocity.assign(vec3(0));
                newLife.assign(generateLifeDuration());
            });

            position.assign(newPosition);
            velocity.assign(newVelocity);
            life.assign(newLife);
        })().compute(this.amount);
    }

    /**
     * Update the simulation by one frame.
     * @param {number} [delta=1/60] The time in seconds since the last frame.
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
    }
}

export default ParticlesMesh;
