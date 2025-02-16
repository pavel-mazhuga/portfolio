import Stats from 'stats-gl';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import BloomNode, { bloom } from 'three/examples/jsm/tsl/display/BloomNode.js';
import {
    Discard,
    Fn,
    If,
    ShaderNodeObject,
    deltaTime,
    distance,
    float,
    hash,
    instanceIndex,
    min,
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
    ACESFilmicToneMapping,
    ComputeNode,
    InstancedMesh,
    Mesh,
    PerspectiveCamera,
    Plane,
    PlaneGeometry,
    PostProcessing,
    Scene,
    SpriteNodeMaterial,
    StorageBufferNode,
    StorageInstancedBufferAttribute,
    Vector3,
    WebGPURenderer,
} from 'three/webgpu';
import { Pane } from 'tweakpane';
import { lerp } from '@/utils/lerp';
import { Pointer } from '@/utils/webgpu/Pointer';

class Demo {
    canvas: HTMLCanvasElement;
    renderer: WebGPURenderer;
    postProcessing: PostProcessing;
    camera: PerspectiveCamera;
    scene: Scene;
    controls?: OrbitControls;
    stats?: Stats;
    mesh?: Mesh;
    tweakPane?: Pane;
    pointerHandler: Pointer;
    lerpedSpawnCount = 0;

    particlesPositionsBuffer: ShaderNodeObject<StorageBufferNode>;
    particlesVelocitiesBuffer: ShaderNodeObject<StorageBufferNode>;
    particlesLifeBuffer: ShaderNodeObject<StorageBufferNode>;

    updateParticlesCompute: ComputeNode;

    bloomPass: ShaderNodeObject<BloomNode>;

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
        isMoving: uniform(0),
        spawnCount: uniform(0),
        sparkLifeDecay: uniform(this.params.sparkLifeDecay),
        sparkSpread: uniform(this.params.sparkSpread),
        sparkSpeed: uniform(this.params.sparkSpeed),
    };

    lastPointerPosition = new Vector3();

    constructor(canvas: HTMLCanvasElement) {
        this.render = this.render.bind(this);
        this.onWindowResize = this.onWindowResize.bind(this);

        this.canvas = canvas;
        this.renderer = new WebGPURenderer({ canvas, powerPreference: 'high-performance' });
        this.renderer.toneMapping = ACESFilmicToneMapping;
        this.renderer.setPixelRatio(this.dpr);
        this.renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);

        this.scene = new Scene();
        this.scene.backgroundNode = Fn(() => {
            const color = vec3(mx_fractal_noise_vec3(vec3(screenUV, time.mul(0.17)))).toVar();
            color.mulAssign(0.07);

            return vec4(color, 1);
        })();

        this.camera = new PerspectiveCamera(45, canvas.width / canvas.height, 0.1, 100);
        this.camera.position.set(0, 0, 5);

        if (process.env.NODE_ENV === 'development') {
            this.stats = new Stats({
                trackGPU: true,
            });
            this.stats.init(this.renderer);
            canvas.parentElement?.appendChild(this.stats.dom);
        }

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

        const initParticlesCompute = Fn<any>(() => {
            this.particlesPositionsBuffer.element(instanceIndex).xyz.assign(vec3(0));
            this.particlesVelocitiesBuffer.element(instanceIndex).xyz.assign(vec3(0));
            this.particlesLifeBuffer.element(instanceIndex).assign(0);
        })().compute(this.params.amount);

        this.renderer.computeAsync(initParticlesCompute);

        this.updateParticlesCompute = Fn<any>(() => {
            const position = this.particlesPositionsBuffer!.element(instanceIndex);
            const velocity = this.particlesVelocitiesBuffer!.element(instanceIndex);
            const life = this.particlesLifeBuffer!.element(instanceIndex);

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

        this.#initEvents();
        this.#initTweakPane();

        /**
         * Post processing
         */

        this.postProcessing = new PostProcessing(this.renderer);

        // Color
        const scenePass = pass(this.scene, this.camera);
        const scenePassColor = scenePass.getTextureNode('output');

        // Bloom
        this.bloomPass = bloom(
            scenePassColor,
            this.params.bloom.intensity,
            this.params.bloom.radius,
            this.params.bloom.threshold,
        );

        // Output
        this.postProcessing.outputNode = scenePassColor.add(this.bloomPass);

        this.renderer.setAnimationLoop(this.render);
    }

    get dpr() {
        return Math.min(window.devicePixelRatio, 1.5);
    }

    onWindowResize() {
        const width = this.canvas.parentElement?.offsetWidth || 1;
        const height = this.canvas.parentElement?.offsetHeight || 1;
        this.renderer.setPixelRatio(this.dpr);
        this.renderer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.controls?.update();
    }

    #initEvents() {
        window.addEventListener('resize', this.onWindowResize);
    }

    #destroyEvents() {
        window.removeEventListener('resize', this.onWindowResize);
    }

    #initTweakPane() {
        this.tweakPane = new Pane({
            title: 'Parameters',
            expanded: matchMedia('(min-width: 1200px)').matches,
        });

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

    #destroyTweakPane() {
        this.tweakPane?.dispose();
    }

    async render() {
        this.stats?.update();
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

        if (this.updateParticlesCompute instanceof ComputeNode) {
            this.renderer.computeAsync(this.updateParticlesCompute);
        }

        if (this.params.usePostprocessing) {
            this.postProcessing.renderAsync();
        } else {
            this.renderer.renderAsync(this.scene, this.camera);
        }
    }

    destroy() {
        this.renderer.setAnimationLoop(null);

        this.#destroyEvents();
        this.#destroyTweakPane();
        this.controls?.dispose();
        this.stats?.dom.remove();
        this.pointerHandler.destroy();
        this.particlesPositionsBuffer?.dispose();
        this.particlesLifeBuffer?.dispose();
        this.particlesVelocitiesBuffer?.dispose();

        if (this.renderer.hasInitialized()) {
            this.renderer.dispose();
        }
    }
}

export default Demo;
