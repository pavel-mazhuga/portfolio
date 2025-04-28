import { InstancedMesh, PlaneGeometry, SRGBColorSpace, Texture, TextureLoader, Vector3 } from 'three';
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
import { SpriteNodeMaterial, StorageBufferNode, StorageInstancedBufferAttribute, WebGPURenderer } from 'three/webgpu';
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
        gravity: 0.098,
        wind: new Vector3(0, -0.2, 0),
    };

    uniforms = {
        gravity: uniform(this.params.gravity).label('gravity'),
        wind: uniform(this.params.wind).label('wind'),
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
            positions: storage(new StorageInstancedBufferAttribute(this.count, 3), 'vec3', this.count)
                .label('positionsBuffer')
                .setPBO(true),
            velocities: storage(new StorageInstancedBufferAttribute(this.count, 3), 'vec3', this.count)
                .label('velocitiesBuffer')
                .setPBO(true),
        };

        material.positionNode = Fn(() => {
            /**
             * Read from buffers
             */

            const position = this.buffers.positions.element(instanceIndex);
            const velocity = this.buffers.velocities.element(instanceIndex);

            const newPosition = position.toVar('newPosition');
            const newVelocity = velocity.toVar('newVelocity');

            const mass = float(0.8).add(hash(instanceIndex).mul(0.2));
            const respawnPos = getStartPosition();
            const clampedDeltaTime = deltaTime.min(0.02).toVar('clampedDeltaTime');

            /**
             * Wind
             */

            const wind = this.uniforms.wind.div(mass);

            /**
             * Velocity
             */

            newVelocity.addAssign(wind);
            newVelocity.xz.addAssign(simplexNoise3d(position).mul(0.1));
            newVelocity.y.subAssign(this.uniforms.gravity);
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

            return position;
        })().compute(this.count);

        material.scaleNode = float(0.03).add(hash(instanceIndex).mul(0.03));

        material.rotationNode = hash(instanceIndex).mul(time).mul(this.uniforms.wind.x);

        const getStartPosition = () =>
            vec3(
                hash(instanceIndex)
                    .sub(0.5)
                    .mul(this.viewport.width * 3),
                hash(instanceIndex.add(1))
                    .mul(this.viewport.height * 4)
                    .add(this.viewport.top * 2.8),
                hash(instanceIndex.add(2)).negate().mul(10),
            );

        this.renderer.computeAsync(
            Fn(() => {
                this.buffers.positions.element(instanceIndex).assign(getStartPosition());
            })().compute(this.count),
        );
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

        folder.addBinding(this.params, 'gravity', { min: 0, max: 3, step: 0.001 }).on('change', () => {
            this.uniforms.gravity.value = this.params.gravity;
        });
        folder.addBinding(this.params, 'wind', { min: -10, max: 10, step: 0.01 }).on('change', () => {
            this.uniforms.wind.value.copy(this.params.wind);
        });
    }
}

export default Snowflakes;
