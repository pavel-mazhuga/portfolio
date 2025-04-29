import { InstancedMesh, PlaneGeometry, SRGBColorSpace, Texture, TextureLoader, Vector3 } from 'three';
import {
    Fn,
    If,
    PI2,
    ShaderNodeObject,
    deltaTime,
    float,
    hash,
    instanceIndex,
    instancedArray,
    time,
    uniform,
    vec3,
} from 'three/tsl';
import { SpriteNodeMaterial, StorageBufferNode, WebGPURenderer } from 'three/webgpu';
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
    viewport: Parameters['viewport'];

    buffers: {
        positions: ShaderNodeObject<StorageBufferNode>;
        velocities: ShaderNodeObject<StorageBufferNode>;
    };

    params = {
        friction: 0.99,
        gravity: 0.098,
        wind: new Vector3(0, -0.003, 0),
    };

    uniforms = {
        gravity: uniform(this.params.gravity).label('gravity'),
        wind: uniform(this.params.wind).label('wind'),
        friction: uniform(this.params.friction).label('friction'),
    };

    static geometry = new PlaneGeometry();

    static snowflakeTexture: Texture | null = null;

    constructor({ amount, renderer, viewport }: Parameters) {
        const snowflakeTexture =
            Snowflakes.snowflakeTexture ||
            (() => {
                const texture = new TextureLoader().load('/img/snowflake.webp');
                texture.colorSpace = SRGBColorSpace;
                Snowflakes.snowflakeTexture = texture;
                return texture;
            })();

        const material = new SpriteNodeMaterial({
            transparent: true,
            depthWrite: false,
            sizeAttenuation: true,
            map: snowflakeTexture,
            alphaTest: 0.5,
        });

        super(Snowflakes.geometry, material, amount);

        this.renderer = renderer;
        this.viewport = viewport;

        this.buffers = {
            positions: instancedArray(this.count, 'vec3').label('positionsBuffer').setPBO(true),
            velocities: instancedArray(this.count, 'vec3').label('velocitiesBuffer').setPBO(true),
        };

        const getStartPosition = () =>
            vec3(
                hash(instanceIndex.add(time))
                    .sub(0.5)
                    .mul(this.viewport.width * 2),
                hash(instanceIndex.add(time).add(1))
                    .mul(this.viewport.height * 1.5)
                    .add(this.viewport.height / 2),
                hash(instanceIndex.add(time).add(2)).negate().mul(5),
            );

        this.renderer.computeAsync(
            Fn(() => {
                this.buffers.positions.element(instanceIndex).assign(getStartPosition());
            })().compute(this.count),
        );

        const size = float(0.01).add(hash(instanceIndex).mul(0.01));
        const mass = size;

        material.positionNode = Fn(() => {
            /**
             * Read from buffers
             */

            const position = this.buffers.positions.element(instanceIndex);
            const velocity = this.buffers.velocities.element(instanceIndex);

            const newPosition = position.toVar('newPosition');
            const newVelocity = velocity.toVar('newVelocity');

            const clampedDeltaTime = deltaTime.min(0.02).toVar('clampedDeltaTime');

            /**
             * Wind
             */

            const wind = this.uniforms.wind.div(mass);

            /**
             * Velocity
             */

            newVelocity.addAssign(wind);
            newVelocity.xz.addAssign(simplexNoise3d(position).div(mass.mul(1000)));
            newVelocity.y.subAssign(this.uniforms.gravity);
            newVelocity.y.mulAssign(this.uniforms.friction);
            newVelocity.mulAssign(clampedDeltaTime);

            /**
             * Position
             */

            newPosition.addAssign(newVelocity);

            /**
             * Life
             */

            If(newPosition.y.lessThan(this.viewport.bottom), () => {
                newPosition.assign(getStartPosition());
            });

            /**
             * Write to buffers
             */

            position.assign(newPosition);
            velocity.assign(newVelocity);

            return position;
        })().compute(this.count);

        material.scaleNode = size;

        material.rotationNode = hash(instanceIndex).mul(PI2).add(time.mul(mass).mul(100));
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

        folder.addBinding(this, 'count', { min: 0, max: this.count, step: 1 });

        folder.addBinding(this.params, 'gravity', { min: 0, max: 3, step: 0.001 }).on('change', () => {
            this.uniforms.gravity.value = this.params.gravity;
        });

        folder.addBinding(this.params, 'wind', { min: -10, max: 10, step: 0.0001 }).on('change', () => {
            this.uniforms.wind.value.copy(this.params.wind);
        });
    }
}

export default Snowflakes;
