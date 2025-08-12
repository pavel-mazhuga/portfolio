import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';
import {
    Discard,
    Fn,
    If,
    ShaderNodeObject,
    deltaTime,
    float,
    hash,
    instanceIndex,
    instancedArray,
    length,
    min,
    output,
    positionLocal,
    select,
    sin,
    uniform,
    uv,
    vec3,
    vec4,
} from 'three/tsl';
import {
    AdditiveBlending,
    BufferGeometry,
    Color,
    DoubleSide,
    InstancedMesh,
    Mesh,
    MeshStandardNodeMaterial,
    NodeMaterial,
    PlaneGeometry,
    SpriteNodeMaterial,
    StorageBufferNode,
    UniformNode,
    Vector3,
    WebGPURenderer,
} from 'three/webgpu';
import { simplexNoise3d } from '@/utils/webgpu/nodes/noise/simplexNoise3d';

export class DissolveMesh extends Mesh<BufferGeometry, NodeMaterial> {
    uniforms = {
        progress: uniform(0),
        edge: uniform(0.05),
        frequency: uniform(1.3),
        noiseOffset: uniform(vec3(0, 3, 0)),
        particles: {
            size: uniform(1),
            speed: uniform(0.001),
            decayFrequency: uniform(1),
            decayDistance: uniform(0.2),
            color: uniform(new Color('#bc6dff')),
        },
    };

    particlesBasePositionsBuffer: ShaderNodeObject<StorageBufferNode>;
    particlesPositionsBuffer: ShaderNodeObject<StorageBufferNode>;
    particlesVelocitiesBuffer: ShaderNodeObject<StorageBufferNode>;
    particlesLifeBuffer: ShaderNodeObject<StorageBufferNode>;

    noiseNode = Fn(() => {
        const { frequency, noiseOffset } = this.uniforms;
        return simplexNoise3d(positionLocal.add(noiseOffset).mul(frequency));
    })();

    constructor(
        geometry: BufferGeometry,
        material: NodeMaterial,
        {
            count = 1000,
            color = uniform(new Color('#fff')),
            renderer,
        }: {
            count?: number;
            color?: ShaderNodeObject<UniformNode<Color>>;
            renderer: WebGPURenderer;
        },
    ) {
        super(geometry, material);

        material.side = DoubleSide;

        const noise = this.noiseNode;

        const mappedProgress = this.uniforms.progress.remap(0, 1, -1, 1).toVar('mappedProgress');
        const edgeWidth = mappedProgress.add(this.uniforms.edge).toVar('edgeWidth');
        const isEdge = noise.greaterThan(mappedProgress).and(noise.lessThan(edgeWidth)).toVar('edge');

        if (material instanceof MeshStandardNodeMaterial) {
            material.emissiveNode = select(isEdge, this.uniforms.particles.color, output);
        }

        material.colorNode = Fn(() => {
            Discard(noise.lessThan(mappedProgress));
            return select(isEdge, vec4(this.uniforms.particles.color, noise), color);
        })();

        /**
         * Particles
         */

        const particlesMaterial = new SpriteNodeMaterial({
            transparent: true,
            depthWrite: false,
            sizeAttenuation: true,
            blending: AdditiveBlending,
        });

        const particlesMesh = new InstancedMesh(new PlaneGeometry(), particlesMaterial, count);
        this.add(particlesMesh);

        const sampler = new MeshSurfaceSampler(this).build();

        const position = new Vector3();
        const positions = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            sampler.sample(position);
            positions[i * 3] = position.x;
            positions[i * 3 + 1] = position.y;
            positions[i * 3 + 2] = position.z;
        }

        this.particlesBasePositionsBuffer = instancedArray(positions, 'vec3');
        this.particlesPositionsBuffer = instancedArray(positions, 'vec3');
        this.particlesVelocitiesBuffer = instancedArray(count * 3, 'vec3');
        this.particlesLifeBuffer = instancedArray(count, 'float');

        renderer.computeAsync(
            Fn(() => {
                this.particlesVelocitiesBuffer.element(instanceIndex).assign(vec3(0));
                this.particlesLifeBuffer.element(instanceIndex).assign(hash(instanceIndex));
            })().compute(count),
        );

        particlesMaterial.positionNode = Fn(() => {
            const life = this.particlesLifeBuffer.element(instanceIndex);
            const velocity = this.particlesVelocitiesBuffer.element(instanceIndex);
            const basePosition = this.particlesBasePositionsBuffer.element(instanceIndex);
            const position = this.particlesPositionsBuffer.element(instanceIndex);

            const newPosition = position.toVar('newPosition');
            const newLife = life.toVar('newLife');
            const newVelocity = velocity.toVar('newVelocity');

            /**
             * Velocity
             */

            const xwave1 = sin(newPosition.y.mul(20)).mul(0.8);
            const xwave2 = sin(newPosition.y.mul(50)).mul(0.7);

            newVelocity.addAssign(vec3(xwave1.add(xwave2), 1, 0).mul(deltaTime.mul(this.uniforms.particles.speed)));

            newPosition.addAssign(newVelocity);

            /**
             * Life
             */

            const { decayFrequency, decayDistance } = this.uniforms.particles;
            const distanceDecay = basePosition.distance(position).remapClamp(0, 1, decayDistance, 1);
            newLife.assign(life.add(deltaTime.mul(decayFrequency).mul(distanceDecay)));

            If(newLife.greaterThan(1), () => {
                newPosition.assign(basePosition);
                newVelocity.assign(vec3(0));
            });

            newLife.assign(newLife.mod(1));

            /**
             * Write the new values to the buffers
             */

            position.assign(newPosition);
            velocity.assign(newVelocity);
            life.assign(newLife);

            return position;
        })().compute(count);

        particlesMaterial.scaleNode = Fn(() => {
            const life = this.particlesLifeBuffer.element(instanceIndex);

            return float(0.05)
                .mul(this.uniforms.particles.size)
                .mul(hash(instanceIndex).mul(0.4).add(0.6))
                .mul(min(life.smoothstep(0, 0.1), life.smoothstep(0.5, 1).oneMinus()));
        })();

        particlesMaterial.colorNode = Fn(() => {
            Discard(isEdge.not());

            const distanceToCenter = length(uv().sub(0.5));
            const value = 0.05;
            const alpha = float(value)
                .div(distanceToCenter)
                .sub(value * 2);

            return vec4(this.uniforms.particles.color, alpha);
        })();
    }

    dispose() {
        this.particlesBasePositionsBuffer.dispose();
        this.particlesPositionsBuffer.dispose();
        this.particlesVelocitiesBuffer.dispose();
        this.particlesLifeBuffer.dispose();
    }
}
