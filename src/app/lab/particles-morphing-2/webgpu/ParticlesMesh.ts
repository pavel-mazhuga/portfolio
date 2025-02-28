import { AdditiveBlending, Color, InstancedMesh, PlaneGeometry } from 'three';
import {
    Fn,
    If,
    ShaderNodeObject,
    bool,
    float,
    hash,
    instanceIndex,
    length,
    min,
    mix,
    select,
    smoothstep,
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
    WebGPURenderer,
} from 'three/webgpu';
import { Pane } from 'tweakpane';
import { Pointer } from '@/utils/webgpu/Pointer';
import { curlNoise4d } from '@/utils/webgpu/nodes/noise/curlNoise4d';
import { rotate3dY } from '@/utils/webgpu/nodes/rotate-3d-y';

class ParticlesMesh extends InstancedMesh<PlaneGeometry, SpriteNodeMaterial> {
    renderer: WebGPURenderer;
    amount: number;
    positions: number[][];
    colors: Color[][];

    pointerHandler: Pointer;

    buffers: {
        basePositions?: ShaderNodeObject<StorageBufferNode>;
        colors?: ShaderNodeObject<StorageBufferNode>;
        positions?: ShaderNodeObject<StorageBufferNode>;
        velocities?: ShaderNodeObject<StorageBufferNode>;
    } = {};

    updateCompute: ComputeNode;

    params = {
        baseParticleScale: 1,
        rotationProgress: 0,
        wigglePower: 0.6,
        wiggleSpeed: 1,
        isOffset: matchMedia('(orientation: landscape)').matches,
    };

    uniforms = {
        prevActiveIndex: uniform(0),
        activeIndex: uniform(0),
        transitionProgress: uniform(0),
        colors: uniformArray([new Color('#FF0019'), new Color('#FF5F00')]),
        scale: uniform(this.params.baseParticleScale),
        wigglePower: uniform(this.params.wigglePower),
        wiggleSpeed: uniform(this.params.wiggleSpeed),
        // isOffset: uniform(this.params.isOffset),
    };

    constructor(
        renderer: WebGPURenderer,
        amount: number,
        positions: number[][],
        colors: Color[][],
        pointerHandler: Pointer,
    ) {
        const geometry = new PlaneGeometry();
        const material = new SpriteNodeMaterial({
            transparent: true,
            depthWrite: false,
            sizeAttenuation: true,
            blending: AdditiveBlending,
        });

        super(geometry, material, amount);

        this.frustumCulled = false;
        this.renderer = renderer;
        this.amount = amount;
        this.positions = positions;
        this.colors = colors;
        this.pointerHandler = pointerHandler;

        this.buffers.basePositions = storage(
            new StorageInstancedBufferAttribute(new Float32Array(positions.flat() as unknown as ArrayBufferLike, 3), 3),
            'vec3',
            this.amount * positions.length,
        ).setPBO(true);
        this.buffers.colors = storage(
            new StorageInstancedBufferAttribute(
                new Float32Array(
                    colors
                        .flat()
                        .map((color) => [color.r, color.g, color.b])
                        .flat() as unknown as ArrayBufferLike,
                    3,
                ),
                3,
            ),
            'vec3',
            this.amount * colors.length,
        ).setPBO(true);
        this.buffers.positions = storage(new StorageInstancedBufferAttribute(this.amount, 3), 'vec3', this.amount);
        this.buffers.velocities = storage(new StorageInstancedBufferAttribute(this.amount, 3), 'vec3', this.amount);

        material.positionNode = this.buffers.positions.element(instanceIndex);

        material.scaleNode = float(hash(instanceIndex).mul(0.5).add(0.5).mul(0.1)).mul(this.uniforms.scale);

        material.colorNode = Fn(() => {
            const position = this.buffers.positions!.element(instanceIndex);
            const velocity = this.buffers.velocities!.element(instanceIndex);

            const mainColor = mix(
                mix(
                    this.buffers.colors!.element(1).sub(0.1),
                    this.buffers.colors!.element(1),
                    position.y.add(1).clamp(0, 1),
                ),
                mix(
                    this.buffers.colors!.element(2).sub(0.5),
                    this.buffers.colors!.element(2),
                    position.y.add(1).clamp(0, 1),
                ),
                position.x.sub(0.5).clamp(0, 1),
            ).toVar();
            const color = mix(mainColor, this.buffers.colors!.element(0), velocity.length().mul(30).pow(2).clamp(0, 1));
            const distanceToCenter = length(uv().sub(0.5));
            const alpha = float(0.03).div(distanceToCenter).sub(0.06);

            return vec4(color, alpha);
        })();

        const initCompute = Fn(() => {
            this.buffers.positions
                ?.element(instanceIndex)
                .assign(
                    vec3(hash(instanceIndex).sub(6), hash(instanceIndex.add(1).mul(10)), hash(instanceIndex.add(2))),
                );

            this.buffers.velocities?.element(instanceIndex).assign(vec3(0));
        })().compute(this.amount);

        this.renderer.computeAsync(initCompute);

        this.updateCompute = Fn(() => {
            const position = this.buffers.positions!.element(instanceIndex);
            const buffer = this.buffers.basePositions!;
            const offset = 2.5;
            const basePosition = buffer
                .element(select(this.uniforms.activeIndex.equal(0), instanceIndex, instanceIndex.add(this.amount)))
                .toVar();

            If(bool(this.params.isOffset), () => {
                basePosition.assign(
                    basePosition
                        .mul(rotate3dY(float(-0.35).add(float(0.7).mul(this.uniforms.activeIndex))))
                        .add(vec3(float(-offset).add(float(offset * 2).mul(this.uniforms.activeIndex)), 0, 0)),
                );
            });

            const velocity = this.buffers.velocities!.element(instanceIndex);

            const flowField = curlNoise4d(vec4(position, 0)).toVar('flowField');

            /**
             * Noise
             */

            const wiggle = curlNoise4d(vec4(position.mul(rotate3dY(time)), time.mul(this.uniforms.wiggleSpeed)))
                .mul(this.uniforms.wigglePower)
                .toVar();

            /**
             * Overshoot
             */

            const overshoot = velocity.mul(hash(instanceIndex).mul(0.05).add(0.6)).mul(flowField.mul(1.2)).toVar();

            /**
             * Speed
             */

            const toTargetPosition = basePosition.sub(position).toVar('toTargetPosition');
            const toTargetPositionLength = toTargetPosition.length().toVar('toTargetPositionLength');
            const toTargetPositionDirection = toTargetPosition.normalize().toVar('toTargetPositionDirection');
            const scale = toTargetPositionLength.remapClamp(0, 1, 0, 0.1).mul(0.4);
            const speed = toTargetPositionDirection.mul(scale).mul(hash(instanceIndex).mul(0.35).add(0.6)).toVar();

            /**
             * Velocity
             */

            const overshootedSpeed = overshoot.add(speed).toVar();
            velocity.assign(overshootedSpeed.normalize().add(wiggle).normalize().mul(overshootedSpeed.length()));

            position.addAssign(velocity);
        })().compute(this.amount);
    }

    setActiveIndex(index: number) {
        this.uniforms.activeIndex.value = index;
    }

    update() {
        this.renderer.computeAsync(this.updateCompute);
    }

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

    initTweakPane(tweakPane: Pane) {
        const folder = tweakPane.addFolder({ title: 'Particles' });

        folder.addBinding(this.params, 'wigglePower', { min: 0, max: 0.7, step: 0.01 }).on('change', (event) => {
            this.uniforms.wigglePower.value = event.value;
        });

        folder.addBinding(this.params, 'wiggleSpeed', { min: 0, max: 3, step: 0.01 }).on('change', (event) => {
            this.uniforms.wiggleSpeed.value = event.value;
        });

        folder.addBinding(this.params, 'baseParticleScale', { min: 0.1, max: 3, step: 0.01 }).on('change', (event) => {
            this.uniforms.scale.value = event.value;
        });

        folder.addBinding(this.params, 'baseParticleScale', { min: 0.1, max: 3, step: 0.01 }).on('change', (event) => {
            this.uniforms.scale.value = event.value;
        });

        // folder.addBinding(this.params, 'isOffset').on('change', (event) => {
        //     this.uniforms.isOffset.value = event.value;
        // });
    }
}

export default ParticlesMesh;
