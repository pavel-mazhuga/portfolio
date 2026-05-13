import { bloom } from 'three/examples/jsm/tsl/display/BloomNode.js';
import {
    Discard,
    Fn,
    If,
    deltaTime,
    distance,
    float,
    hash,
    instanceIndex,
    mx_fractal_noise_vec3,
    normalize,
    pass,
    screenUV,
    smoothstep,
    storage,
    time,
    uniform,
    uv,
    vec2,
    vec3,
    vec4,
} from 'three/tsl';
import {
    ComputeNode,
    InstancedMesh,
    Plane,
    PlaneGeometry,
    RenderPipeline,
    SpriteNodeMaterial,
    StorageBufferNode,
    StorageInstancedBufferAttribute,
    TimestampQuery,
    Vector3,
} from 'three/webgpu';
import { lerp } from '@/shared/lib/math/lerp';
import { Pointer } from '../lib/Pointer';
import BaseExperience from '../model/BaseExperience';

class Demo extends BaseExperience {
    postProcessing: RenderPipeline;
    mesh!: InstancedMesh<PlaneGeometry, SpriteNodeMaterial>;
    pointerHandler!: Pointer;
    lerpedSpawnCount = 0;

    particlesPositionsBuffer!: StorageBufferNode<'vec3'>;
    particlesVelocitiesBuffer!: StorageBufferNode<'vec3'>;
    particlesLifeBuffer!: StorageBufferNode<'float'>;

    updateParticlesCompute!: ComputeNode;

    bloomPass!: ReturnType<typeof bloom>;

    params = {
        amount: 1000,
        usePostprocessing: true,
        sparkSpeed: 2,
        sparkLifeDecay: 0.8,
        sparkSpread: 1,
        velocityThreshold: 0.01,
        spawnMultiplier: 1,
        minSpawnCount: 1,
        bloom: {
            intensity: 0.45,
            radius: 0.5,
            threshold: 0.15,
        },
    };

    uniforms = {
        pointerVelocity: uniform(new Vector3()),
        spawnCount: uniform(0),
        sparkLifeDecay: uniform(this.params.sparkLifeDecay),
        sparkSpread: uniform(this.params.sparkSpread),
        sparkSpeed: uniform(this.params.sparkSpeed),
    };

    lastPointerPosition = new Vector3();

    constructor(canvas: HTMLCanvasElement) {
        super(canvas);

        this.scene.backgroundNode = Fn(() => {
            const color = vec3(mx_fractal_noise_vec3(vec3(screenUV, time.mul(0.17)))).toVar();

            color.mulAssign(0.07);

            return vec4(color, 1);
        })();

        this.camera.fov = 45;
        this.camera.updateProjectionMatrix();
        this.camera.position.set(0, 0, 5);

        this.pointerHandler = new Pointer(this.renderer, this.camera, new Plane(new Vector3(0, 0, 1), 0));

        this.particlesPositionsBuffer = storage(
            new StorageInstancedBufferAttribute(this.params.amount, 3),
            'vec3',
            this.params.amount,
        ).setPBO(true);

        this.particlesLifeBuffer = storage(
            new StorageInstancedBufferAttribute(this.params.amount, 1),
            'float',
            this.params.amount,
        );

        this.particlesVelocitiesBuffer = storage(
            new StorageInstancedBufferAttribute(this.params.amount, 3),
            'vec3',
            this.params.amount,
        );

        const initParticlesCompute = Fn(() => {
            this.particlesPositionsBuffer.element(instanceIndex).xyz.assign(vec3(0));
            this.particlesVelocitiesBuffer.element(instanceIndex).xyz.assign(vec3(0));
            this.particlesLifeBuffer.element(instanceIndex).assign(0);
        })().compute(this.params.amount);

        void this.renderer.computeAsync(initParticlesCompute);

        this.updateParticlesCompute = Fn(() => {
            const position = this.particlesPositionsBuffer.element(instanceIndex);
            const velocity = this.particlesVelocitiesBuffer.element(instanceIndex);
            const life = this.particlesLifeBuffer.element(instanceIndex);

            position.xyz.addAssign(velocity.mul(deltaTime));
            life.subAssign(deltaTime.mul(this.uniforms.sparkLifeDecay));

            If(life.lessThan(0), () => {
                const randomDir = normalize(
                    vec3(
                        hash(instanceIndex.mul(time)),
                        hash(instanceIndex.mul(time.add(1))),
                        hash(instanceIndex.mul(time.add(2))),
                    ).sub(0.5),
                );

                If(float(instanceIndex).lessThan(this.uniforms.spawnCount), () => {
                    position.xyz.assign(this.pointerHandler.uPointer);
                    velocity.xyz.assign(
                        randomDir
                            .mul(this.uniforms.sparkSpeed)
                            .add(this.uniforms.pointerVelocity)
                            .mul(this.uniforms.sparkSpread),
                    );
                    life.assign(hash(instanceIndex.add(time)).mul(1).add(0.5));
                }).Else(() => {
                    position.xyz.assign(vec3(0));
                    velocity.xyz.assign(vec3(0));
                    life.assign(0);
                });
            }).Else(() => {
                velocity.y.subAssign(deltaTime.mul(2));
                velocity.mulAssign(0.98);
            });
        })().compute(this.params.amount);

        const geometry = new PlaneGeometry();

        const material = new SpriteNodeMaterial({
            depthWrite: false,
            sizeAttenuation: true,
            transparent: true,
        });

        material.positionNode = this.particlesPositionsBuffer.element(instanceIndex);

        material.scaleNode = hash(instanceIndex).mul(0.8).add(0.2).mul(0.05);

        material.colorNode = Fn(() => {
            Discard(distance(uv(), vec2(0.5)).greaterThan(0.5));

            const life = this.particlesLifeBuffer.element(instanceIndex);
            const opacity = smoothstep(0, 0.2, life);

            return vec4(hash(instanceIndex), hash(instanceIndex.add(1)), hash(instanceIndex.add(2)), opacity);
        })();

        this.mesh = new InstancedMesh(geometry, material, this.params.amount);
        this.mesh.frustumCulled = false;
        this.mesh.matrixAutoUpdate = false;
        this.scene.add(this.mesh);

        this.postProcessing = new RenderPipeline(this.renderer);

        const scenePass = pass(this.scene, this.camera);
        const scenePassColor = scenePass.getTextureNode('output');

        this.bloomPass = bloom(
            scenePassColor,
            this.params.bloom.intensity,
            this.params.bloom.radius,
            this.params.bloom.threshold,
        );

        this.postProcessing.outputNode = scenePassColor.add(this.bloomPass);

        this.initTweakPane();
    }

    get dpr() {
        return Math.min(window.devicePixelRatio, 1.5);
    }

    async render() {
        this.clock.update();
        const elapsedTime = this.clock.getElapsed();

        this.delta = elapsedTime - this.prevTime;
        this.prevTime = elapsedTime;

        this.pointerHandler.update();

        const currentPosition = this.pointerHandler.uPointer.value;

        this.uniforms.pointerVelocity.value.copy(currentPosition).sub(this.lastPointerPosition).multiplyScalar(30);

        const velocity = this.uniforms.pointerVelocity.value.length();

        if (velocity > this.params.velocityThreshold) {
            const normalizedVelocity = Math.min(velocity * velocity * 4, 1);

            const t = normalizedVelocity * normalizedVelocity * (3 - 2 * normalizedVelocity);

            const spawnCount = Math.floor(
                this.params.minSpawnCount +
                    t * (this.params.amount - this.params.minSpawnCount) * this.params.spawnMultiplier,
            );

            this.lerpedSpawnCount = lerp(this.lerpedSpawnCount, spawnCount, 0.05);

            this.uniforms.spawnCount.value = Math.min(this.lerpedSpawnCount, this.params.amount);
        } else {
            this.uniforms.spawnCount.value = 0;
        }

        this.lastPointerPosition.copy(currentPosition);

        await this.renderer.computeAsync(this.updateParticlesCompute);

        if (this.stats) {
            await this.renderer.resolveTimestampsAsync(TimestampQuery.COMPUTE);
        }

        if (this.params.usePostprocessing) {
            this.postProcessing.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }

        if (this.stats) {
            await this.renderer.resolveTimestampsAsync(TimestampQuery.RENDER);
            this.stats.update();
        }
    }

    initTweakPane() {
        super.initTweakPane();

        if (!this.tweakPane) {
            return;
        }

        const particlesFolder = this.tweakPane.addFolder({ title: 'Particles' });

        particlesFolder.addBinding(this.params, 'sparkSpeed', { min: 0, max: 5, step: 0.1 }).on('change', (event) => {
            this.uniforms.sparkSpeed.value = event.value;
        });
        particlesFolder
            .addBinding(this.params, 'sparkLifeDecay', { min: 0.1, max: 2, step: 0.1 })
            .on('change', (event) => {
                this.uniforms.sparkLifeDecay.value = event.value;
            });
        particlesFolder
            .addBinding(this.params, 'sparkSpread', { min: 0.1, max: 3, step: 0.1 })
            .on('change', (event) => {
                this.uniforms.sparkSpread.value = event.value;
            });

        const postprocessingFolder = this.tweakPane.addFolder({ title: 'Post-processing' });

        postprocessingFolder.addBinding(this.params, 'usePostprocessing');

        const bloomFolder = postprocessingFolder.addFolder({ title: 'Bloom' });

        bloomFolder
            .addBinding(this.params.bloom, 'intensity', {
                min: 0,
                max: 2,
                step: 0.05,
                label: 'Intensity',
            })
            .on('change', (event) => {
                this.bloomPass.strength.value = event.value;
            });

        bloomFolder
            .addBinding(this.params.bloom, 'radius', {
                min: 0,
                max: 1,
                step: 0.05,
                label: 'Radius',
            })
            .on('change', (event) => {
                this.bloomPass.radius.value = event.value;
            });

        bloomFolder
            .addBinding(this.params.bloom, 'threshold', {
                min: 0,
                max: 1,
                step: 0.05,
                label: 'Threshold',
            })
            .on('change', (event) => {
                this.bloomPass.threshold.value = event.value;
            });
    }

    destroy() {
        this.scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();

        this.pointerHandler.destroy();
        this.particlesPositionsBuffer.dispose();
        this.particlesLifeBuffer.dispose();
        this.particlesVelocitiesBuffer.dispose();

        this.postProcessing.dispose();

        super.destroy();
    }
}

export default Demo;
