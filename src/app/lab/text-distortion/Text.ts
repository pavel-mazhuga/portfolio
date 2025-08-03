import {
    Fn,
    ShaderNodeObject,
    deltaTime,
    hash,
    instanceIndex,
    instancedArray,
    max,
    positionLocal,
    time,
    uniform,
    vec3,
    vec4,
} from 'three/tsl';
import { InstancedMesh, PointLight, SphereGeometry, Texture } from 'three/webgpu';
import { MeshStandardNodeMaterial, StorageBufferNode, WebGPURenderer } from 'three/webgpu';
import { Pane } from 'tweakpane';
import { positionSphereRand } from '@/app/tsl-utils/position-sphere-rand';
import { rotationXYZ } from '@/app/tsl-utils/rotation/rotation-xyz';
import { compose } from '@/utils/webgpu/nodes/compose';
import { curlNoise4d } from '@/utils/webgpu/nodes/noise/curlNoise4d';
import BaseExperience from '../BaseExperience';

type Parameters = { amount: number; renderer: WebGPURenderer; viewport: BaseExperience['viewport'] };

class BlackHole extends InstancedMesh<SphereGeometry, MeshStandardNodeMaterial> {
    renderer: Parameters['renderer'];
    viewport: Parameters['viewport'];
    light: PointLight;

    buffers: { positions: ShaderNodeObject<StorageBufferNode>; velocities: ShaderNodeObject<StorageBufferNode> };

    params = { size: 1.5, radius: 0.1 };

    uniforms = { size: uniform(this.params.size).label('size'), radius: uniform(this.params.radius).label('radius') };

    static geometry = new SphereGeometry(0.002, 16, 16);
    static snowflakeTexture: Texture | null = null;

    constructor({ amount, renderer, viewport }: Parameters) {
        const material = new MeshStandardNodeMaterial();

        super(BlackHole.geometry, material, amount);

        this.renderer = renderer;
        this.viewport = viewport;

        this.buffers = {
            positions: instancedArray(this.count, 'vec4').label('positionsBuffer').setPBO(true),
            velocities: instancedArray(this.count, 'vec3').label('velocitiesBuffer').setPBO(true),
        };

        this.light = new PointLight(0xde861f, 1, 0.2, 1);
        this.light.position.set(0, 0, 0);
        this.add(this.light);

        this.renderer.computeAsync(
            Fn(() => {
                const position = this.buffers.positions.element(instanceIndex);
                position.xyz.assign(positionSphereRand({ radius: this.params.radius }));
                position.w.assign(hash(instanceIndex).add(0.5));
                this.buffers.velocities.element(instanceIndex).assign(vec3());
            })().compute(this.count),
        );

        material.positionNode = Fn(() => {
            /**
             * Read from buffers
             */

            const position = this.buffers.positions.element(instanceIndex);
            const velocity = this.buffers.velocities.element(instanceIndex);

            const newPosition = position.xyz.toVar('newPosition');
            const newVelocity = velocity.toVar('newVelocity');

            const clampedDeltaTime = deltaTime.min(0.02).toVar('clampedDeltaTime');

            /**
             * Attraction
             */
            const attractorPosition = vec3(0, 0, 0);
            const toAttractorVec = attractorPosition.sub(newPosition).toVar('toAttractorVec');
            const objSize = newPosition.w.mul(this.uniforms.size).mul(2).toVar('objSize');
            const intensity = max(objSize, 0.1);
            intensity.mulAssign(toAttractorVec.length().sub(0.1).mul(0.5));
            newVelocity.xyz.addAssign(toAttractorVec.normalize().mul(intensity));
            newVelocity.mulAssign(clampedDeltaTime);
            newPosition.xyz.addAssign(newVelocity);

            /**
             * Velocity
             */

            const flowField = curlNoise4d(vec4(newPosition.add(time.mul(0.05)).mul(5), 0))
                .mul(0.1)
                .toVar();

            newVelocity.addAssign(flowField.div(intensity.mul(20)).mul(hash(instanceIndex.add(1)).mul(1).add(1)));
            newVelocity.mulAssign(clampedDeltaTime);

            /**
             * Position
             */

            newPosition.xyz.addAssign(newVelocity);

            /**
             * Write to buffers
             */

            position.xyz.assign(newPosition);
            velocity.assign(newVelocity);

            const rMat = rotationXYZ(vec3(0));
            const iMat = compose(newPosition, rMat, vec3(position.w).mul(this.uniforms.size));

            return iMat.mul(positionLocal);
        })().compute(this.count);
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
        const folder = tweakPane.addFolder({ title: 'BlackHole' });

        folder.addBinding(this, 'count', { min: 0, max: this.count, step: 1 });

        folder.addBinding(this.params, 'size', { min: 0, max: 3, step: 0.001 }).on('change', () => {
            this.uniforms.size.value = this.params.size;
        });
    }
}

export default BlackHole;
