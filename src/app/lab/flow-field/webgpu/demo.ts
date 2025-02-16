import Stats from 'stats-gl';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { bloom } from 'three/examples/jsm/tsl/display/BloomNode.js';
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
import { Pointer } from '@/utils/webgpu/Pointer';
import { curlNoise4d } from '@/utils/webgpu/nodes/noise/curlNoise4d';

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
    amount = 0;
    pointerHandler: Pointer;

    particlesBasePositionsBuffer?: ShaderNodeObject<StorageBufferNode>;
    particlesPositionsBuffer?: ShaderNodeObject<StorageBufferNode>;
    particlesVelocitiesBuffer?: ShaderNodeObject<StorageBufferNode>;
    particlesLifeBuffer?: ShaderNodeObject<StorageBufferNode>;

    updateParticlesCompute?: ComputeNode;

    params = {
        cursorRadius: 10,
        baseParticleScale: 1,
        pointerAttractionStrength: 0.015,
        hoverPower: 1,
        hoverDuration: 1,
        wanderingSpeed: 0.003,
        contactParticleScaleMultiplier: 1,

        usePostprocessing: true,

        turbFrequency: 0.5,
        turbAmplitude: 0.5,
        turbOctaves: 2,
        turbLacunarity: 2.0,
        turbGain: 0.5,
        turbFriction: 0.01,
    };

    uniforms = {
        cursorRadius: uniform(this.params.cursorRadius),
        scale: uniform(this.params.baseParticleScale),
        pointerAttractionStrength: uniform(this.params.pointerAttractionStrength),
        hoverPower: uniform(this.params.hoverPower),
        hoverDuration: uniform(this.params.hoverDuration),
        wanderingSpeed: uniform(this.params.wanderingSpeed),
        contactScale: uniform(this.params.contactParticleScaleMultiplier),
    };

    constructor(canvas: HTMLCanvasElement) {
        this.render = this.render.bind(this);
        this.onWindowResize = this.onWindowResize.bind(this);

        this.canvas = canvas;
        this.renderer = new WebGPURenderer({ canvas, powerPreference: 'high-performance' });
        this.renderer.toneMapping = ACESFilmicToneMapping;
        this.renderer.setPixelRatio(this.dpr);
        this.renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);

        this.scene = new Scene();

        this.camera = new PerspectiveCamera(45, canvas.width / canvas.height, 0.1, 500);
        this.camera.position.set(0, 0, 50);

        if (process.env.NODE_ENV === 'development') {
            this.stats = new Stats({
                trackGPU: true,
            });
            this.stats.init(this.renderer);
            canvas.parentElement?.appendChild(this.stats.dom);
        }

        this.controls = new OrbitControls(this.camera, this.canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.1;
        this.controls.enabled = matchMedia('(pointer: fine)').matches;

        this.pointerHandler = new Pointer(this.renderer, this.camera, new Plane(new Vector3(0, 0, 1), 0));

        this.scene.backgroundNode = Fn(() => {
            const color = vec3(mx_fractal_noise_vec3(vec3(screenUV, time.mul(0.3)))).toVar();
            color.mulAssign(0.03);

            return vec4(color, 1);
        })();

        const gltfLoader = new GLTFLoader();
        gltfLoader.load('/gltf/face2.glb', (gltf) => {
            gltf.scene.traverse((node) => {
                if (node instanceof Mesh) {
                    node.geometry.toNonIndexed();
                    node.geometry.center();
                    node.geometry.rotateX(-Math.PI / 2);
                    this.amount = node.geometry.attributes.position.array.length / 3;

                    this.particlesBasePositionsBuffer = storage(
                        new StorageInstancedBufferAttribute(node.geometry.attributes.position.array, 3),
                        'vec3',
                        this.amount,
                    ).setPBO(true);

                    this.particlesPositionsBuffer = storage(
                        new StorageInstancedBufferAttribute(node.geometry.attributes.position.array, 3),
                        'vec3',
                        this.amount,
                    );

                    this.particlesLifeBuffer = storage(
                        new StorageInstancedBufferAttribute(this.amount, 1),
                        'float',
                        this.amount,
                    );

                    this.particlesVelocitiesBuffer = storage(
                        new StorageInstancedBufferAttribute(this.amount, 3),
                        'vec3',
                        this.amount,
                    );

                    const strengthBuffer = storage(
                        new StorageInstancedBufferAttribute(this.amount, 1),
                        'float',
                        this.amount,
                    );

                    const initParticlesCompute = Fn<any>(() => {
                        this.particlesVelocitiesBuffer!.element(instanceIndex).xyz.assign(vec3(0));
                        this.particlesLifeBuffer!.element(instanceIndex).assign(hash(instanceIndex).mul(10));
                        strengthBuffer.element(instanceIndex).assign(0);
                    })().compute(this.amount);

                    this.renderer.computeAsync(initParticlesCompute);

                    this.updateParticlesCompute = Fn<any>(() => {
                        const position = this.particlesPositionsBuffer!.element(instanceIndex);
                        const basePosition = this.particlesBasePositionsBuffer!.element(instanceIndex);
                        const velocity = this.particlesVelocitiesBuffer!.element(instanceIndex);
                        const life = this.particlesLifeBuffer!.element(instanceIndex);
                        const strength = strengthBuffer.element(instanceIndex);

                        // velocity
                        const vel = mx_fractal_noise_vec3(
                            position.mul(this.params.turbFrequency),
                            this.params.turbOctaves,
                            this.params.turbLacunarity,
                            this.params.turbGain,
                            this.params.turbAmplitude,
                        ).mul(life.add(0.015));
                        velocity.addAssign(vel);
                        velocity.mulAssign(float(this.params.turbFriction).oneMinus());
                        // position.addAssign(velocity.mul(deltaTime));

                        // Cursor based strength
                        const distanceToCursor = this.pointerHandler.uPointer.distance(basePosition);
                        const cursorStrength = float(this.uniforms.cursorRadius).sub(distanceToCursor).smoothstep(0, 1);

                        strength.assign(
                            strength.add(cursorStrength).sub(deltaTime.mul(this.uniforms.hoverDuration)).clamp(0, 1),
                        );

                        const pointerAttractionDirection = normalize(position.sub(this.pointerHandler.uPointer));
                        const pointerAttraction = pointerAttractionDirection.mul(
                            this.uniforms.pointerAttractionStrength,
                        );

                        position.subAssign(pointerAttraction);

                        const flowField = curlNoise4d(vec4(position, time)).toVar();
                        const wandering = flowField.mul(this.uniforms.wanderingSpeed);

                        position.addAssign(wandering.add(flowField.mul(deltaTime).mul(strength)));
                        position.xy.addAssign(velocity.mul(strength).mul(deltaTime).mul(this.uniforms.hoverPower));

                        // Life
                        const decayFrequency = 1;
                        const distanceDecay = basePosition.distance(position).remapClamp(0, 1, 0.2, 1);
                        const newLife = life.add(deltaTime.mul(decayFrequency).mul(distanceDecay)).toVar();

                        If(newLife.greaterThan(1), () => {
                            position.assign(basePosition);
                        });

                        life.assign(newLife.mod(1));
                    })().compute(this.amount);

                    const geometry = new PlaneGeometry();

                    const material = new SpriteNodeMaterial({
                        depthWrite: false,
                        sizeAttenuation: true,
                    });

                    material.positionNode = this.particlesPositionsBuffer!.element(instanceIndex);

                    material.scaleNode = Fn(() => {
                        const strength = strengthBuffer.element(instanceIndex);
                        const life = this.particlesLifeBuffer!.element(instanceIndex);

                        const scale = min(smoothstep(0, 0.1, life), smoothstep(0.7, 1, life).oneMinus());
                        scale.mulAssign(
                            hash(instanceIndex)
                                .remap(0.5, 1)
                                .mul(
                                    float(0.3)
                                        .mul(this.uniforms.scale)
                                        .add(strength.mul(0.3).mul(this.uniforms.contactScale)),
                                ),
                        );

                        return scale;
                    })();

                    material.colorNode = Fn(() => {
                        const strength = strengthBuffer.element(instanceIndex);

                        Discard(distance(uv(), vec2(0.5)).greaterThan(0.5));

                        return vec4(
                            hash(instanceIndex).add(strength),
                            hash(instanceIndex.add(1)),
                            hash(instanceIndex.add(2)),
                            1,
                        );
                    })();

                    this.mesh = new InstancedMesh(geometry, material, this.amount);
                    this.mesh.frustumCulled = false;
                    this.mesh.matrixAutoUpdate = false;
                    this.scene.add(this.mesh);
                }
            });
        });

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
        const bloomPass = bloom(scenePassColor, 0.12, 0.05, 0.25);

        // Output
        this.postProcessing.outputNode = scenePassColor.add(bloomPass);

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

        this.tweakPane
            .addBinding(this.params, 'cursorRadius', { min: 6, max: 20, step: 0.01 })
            .on('change', (event) => {
                this.uniforms.cursorRadius.value = event.value;
            });

        this.tweakPane
            .addBinding(this.params, 'baseParticleScale', { min: 0, max: 3, step: 0.01 })
            .on('change', (event) => {
                this.uniforms.scale.value = event.value;
            });

        this.tweakPane
            .addBinding(this.params, 'pointerAttractionStrength', { min: 0, max: 0.3, step: 0.01 })
            .on('change', (event) => {
                this.uniforms.pointerAttractionStrength.value = event.value;
            });

        this.tweakPane.addBinding(this.params, 'hoverPower', { min: 0, max: 3, step: 0.01 }).on('change', (event) => {
            this.uniforms.hoverPower.value = event.value;
        });

        this.tweakPane
            .addBinding(this.params, 'hoverDuration', { min: 0.1, max: 1, step: 0.01 })
            .on('change', (event) => {
                this.uniforms.hoverDuration.value = 1 / event.value;
            });

        this.tweakPane
            .addBinding(this.params, 'wanderingSpeed', { min: 0, max: 0.03, step: 0.0001 })
            .on('change', (event) => {
                this.uniforms.wanderingSpeed.value = event.value;
            });

        this.tweakPane
            .addBinding(this.params, 'contactParticleScaleMultiplier', { min: 0, max: 3, step: 0.01 })
            .on('change', (event) => {
                this.uniforms.contactScale.value = event.value;
            });

        this.tweakPane.addBinding(this.params, 'usePostprocessing');
    }

    #destroyTweakPane() {
        this.tweakPane?.dispose();
    }

    async render() {
        this.stats?.update();
        this.pointerHandler.update();

        if (this.updateParticlesCompute instanceof ComputeNode) {
            await this.renderer.computeAsync(this.updateParticlesCompute);
        }

        if (this.params.usePostprocessing) {
            await this.postProcessing.renderAsync();
        } else {
            await this.renderer.renderAsync(this.scene, this.camera);
        }
    }

    destroy() {
        this.renderer.setAnimationLoop(null);

        this.#destroyEvents();
        this.#destroyTweakPane();
        this.controls?.dispose();
        this.stats?.dom.remove();
        this.pointerHandler.destroy();
        this.particlesBasePositionsBuffer?.dispose();
        this.particlesPositionsBuffer?.dispose();
        this.particlesLifeBuffer?.dispose();
        this.particlesVelocitiesBuffer?.dispose();

        if (this.renderer.hasInitialized()) {
            this.renderer.dispose();
        }
    }
}

export default Demo;
