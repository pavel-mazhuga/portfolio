import Stats from 'stats-gl';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { denoise } from 'three/examples/jsm/tsl/display/DenoiseNode.js';
import { ao } from 'three/examples/jsm/tsl/display/GTAONode.js';
import {
    Fn,
    If,
    Loop,
    ShaderNodeObject,
    Var,
    deltaTime,
    float,
    hash,
    instanceIndex,
    length,
    mat3,
    max,
    min,
    mrt,
    mx_fractal_noise_vec3,
    normalView,
    not,
    output,
    pass,
    positionLocal,
    screenUV,
    step,
    storage,
    time,
    uint,
    uniform,
    vec3,
    vec4,
    wgslFn,
} from 'three/tsl';
import {
    ACESFilmicToneMapping,
    ComputeNode,
    DirectionalLight,
    InstancedMesh,
    Mesh,
    MeshStandardNodeMaterial,
    PerspectiveCamera,
    Plane,
    PostProcessing,
    Scene,
    SphereGeometry,
    StorageBufferNode,
    StorageInstancedBufferAttribute,
    Vector3,
    WebGPURenderer,
} from 'three/webgpu';
import { Pane } from 'tweakpane';
import { Pointer } from '@/utils/webgpu/Pointer';

const rotationXYZ = wgslFn(`
    fn rotationXYZ(euler:vec3<f32>) -> mat3x3<f32> {
        let a = cos(euler.x); let b = sin(euler.x);
        let c = cos(euler.y); let d = sin(euler.y);
        let e = cos(euler.z); let f = sin(euler.z);
        let ae = a * e; let af = a * f; let be = b * e; let bf = b * f;
        return mat3x3<f32>(
            vec3<f32>(c * e, af + be * d, bf - ae * d),
            vec3<f32>(-c * f, ae - bf * d, be + af * d),
            vec3<f32>(d, -b * c, a * c)
        );
    }
`);

const compose = wgslFn(`
    fn compose(pos: vec3<f32>, rmat: mat3x3<f32>, scale: vec3<f32>) -> mat4x4<f32> {
        return mat4x4<f32>(
        rmat[0][0] * scale.x, rmat[0][1] * scale.x, rmat[0][2] * scale.x, 0.,
        rmat[1][0] * scale.y, rmat[1][1] * scale.y, rmat[1][2] * scale.y, 0.,
        rmat[2][0] * scale.z, rmat[2][1] * scale.z, rmat[2][2] * scale.z, 0.,
        pos.x, pos.y, pos.z, 1.
    );
    }
`);

class Demo {
    canvas: HTMLCanvasElement;
    renderer: WebGPURenderer;
    postProcessing: PostProcessing;
    camera: PerspectiveCamera;
    scene: Scene;
    controls?: OrbitControls;
    stats?: Stats;
    attractor?: Mesh;
    mesh?: Mesh;
    tweakPane?: Pane;
    amount = 700;
    pointerHandler: Pointer;

    positionsBuffer: ShaderNodeObject<StorageBufferNode>;
    velocitiesBuffer: ShaderNodeObject<StorageBufferNode>;

    computeAttraction: ComputeNode;
    computeCollision: ComputeNode;

    // centerPointLight: PointLight;

    params = {
        usePostprocessing: true,
    };

    uniforms = {
        center: uniform(new Vector3(0)),
    };

    constructor(canvas: HTMLCanvasElement) {
        this.render = this.render.bind(this);
        this.onWindowResize = this.onWindowResize.bind(this);

        this.canvas = canvas;
        // this.renderer = new WebGPURenderer({ canvas, powerPreference: 'high-performance' });
        this.renderer = new WebGPURenderer({
            canvas,
            powerPreference: 'high-performance',
            antialias: !this.params.usePostprocessing,
        });
        this.renderer.toneMapping = ACESFilmicToneMapping;
        this.renderer.setPixelRatio(this.dpr);
        this.renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);

        this.scene = new Scene();
        this.scene.backgroundNode = Fn(() => {
            const color = vec3(mx_fractal_noise_vec3(vec3(screenUV, time.mul(0.3)))).toVar();
            color.mulAssign(0.1);

            return vec4(color, 1);
        })();

        this.camera = new PerspectiveCamera(45, canvas.width / canvas.height, 0.1, 1000);
        this.camera.position.set(0, 0, 5);

        if (process.env.NODE_ENV === 'development') {
            this.stats = new Stats({
                // trackGPU: true,
            });
            this.stats.init(this.renderer);
            canvas.parentElement?.appendChild(this.stats.dom);
        }

        this.pointerHandler = new Pointer(this.renderer, this.camera, new Plane(new Vector3(0, 0, 1), 0));
        this.pointerHandler.clientPointer.x = this.canvas.offsetWidth / 2;
        this.pointerHandler.clientPointer.y = this.canvas.offsetHeight / 2;

        this.positionsBuffer = storage(new StorageInstancedBufferAttribute(this.amount, 4), 'vec4', this.amount).setPBO(
            true,
        );
        this.velocitiesBuffer = storage(
            new StorageInstancedBufferAttribute(this.amount, 4),
            'vec4',
            this.amount,
        ).setPBO(true);

        const center = uniform(new Vector3(0));
        this.uniforms.center = center;
        const size = uniform(0.12);
        const attractorSize = uniform(8);
        const maxVelocity = uniform(0.03);

        const geometry = new SphereGeometry(1, 32, 32);
        geometry.deleteAttribute('uv');

        const hash0 = Var(hash(instanceIndex));
        const hash1 = Var(hash(instanceIndex.add(1)));
        const hash2 = Var(hash(instanceIndex.add(2)));
        const hash3 = Var(hash(instanceIndex.add(3)));
        const hash4 = Var(hash(instanceIndex.add(4)));
        const hash5 = Var(hash(instanceIndex.add(5)));

        const isAttractor = instanceIndex.equal(0);

        const position = this.positionsBuffer.element(instanceIndex);
        const velocity = this.velocitiesBuffer.element(instanceIndex);

        const initCompute = Fn(() => {
            velocity.xyz.assign(0);

            If(isAttractor, () => {
                position.xyz.assign(center);
                position.w.assign(attractorSize);
                velocity.w.assign(0);
            }).Else(() => {
                position.xyz.assign(vec3(hash0.sub(0.5).mul(20), hash3.sub(0.5).mul(20), hash5.sub(0.5).mul(20)));
                position.w.assign(hash4.mul(0.3).add(0.7));
                velocity.w.assign(1);
            });
        })().compute(this.amount);

        this.renderer.computeAsync(initCompute);

        this.computeAttraction = Fn(() => {
            If(not(isAttractor), () => {
                const dv = Var(center.sub(position.xyz));
                const objSize = Var(position.w.mul(size));
                const intensity = max(objSize.mul(objSize), 0.1);
                velocity.xyz.addAssign(dv.normalize().mul(0.005).mul(intensity));
                velocity.xyz.mulAssign(0.999);
                velocity.xyz.assign(min(velocity, maxVelocity));
                position.xyz.addAssign(velocity);
            }).Else(() => {
                position.xyz.assign(center);
            });
        })().compute(this.amount);

        this.computeCollision = Fn(() => {
            const position1 = position;
            const velocity1 = velocity;
            const count = uint(this.amount);

            Loop({ start: uint(0), end: count, type: 'uint', condition: '<' }, ({ i }) => {
                If(uint(i).notEqual(instanceIndex), () => {
                    const position2 = this.positionsBuffer.element(i);
                    const dv = Var(position2.xyz.sub(position1.xyz));
                    const distance = Var(length(dv));
                    const minDistance = Var(position1.w.mul(size).add(position2.w.mul(size)));

                    If(distance.lessThan(minDistance), () => {
                        const velocity2 = this.velocitiesBuffer.element(i);
                        const diff = minDistance.sub(distance);
                        const correction = Var(dv.normalize().mul(diff.mul(0.3)));

                        If(not(isAttractor), () => {
                            const velocityCorrection1 = correction.mul(max(length(velocity1.xyz), 2));
                            // position1.xyz.subAssign(correction);
                            position1.xyz.subAssign(correction.mul(float(2).sub(step(velocity2.w, 1))));
                            velocity1.xyz.subAssign(velocityCorrection1);
                        });

                        If(uint(i).greaterThan(0), () => {
                            const velocityCorrection2 = correction.mul(max(length(velocity2.xyz), 2));
                            // position2.xyz.addAssign(correction);
                            position2.xyz.addAssign(correction.mul(float(2).sub(step(velocity1.w, 1))));
                            velocity2.xyz.addAssign(velocityCorrection2);
                        });
                    });
                });
            });
        })().compute(this.amount);

        /**
         * Balls
         */

        const material = new MeshStandardNodeMaterial({
            roughness: 0.1,
            metalness: 0.1,
        });

        material.positionNode = Fn(() => {
            const position = this.positionsBuffer.element(instanceIndex);

            const rMat = rotationXYZ(vec3(0));
            // const rMat = rotate(positionLocal, vec3(0));
            const iMat = compose(position.xyz, rMat, vec3(position.w).mul(size));
            return iMat.mul(positionLocal);
        })();

        material.colorNode = Fn(() => {
            const color = Var(vec3(1));

            If(not(isAttractor), () => {
                color.assign(vec3(hash0, hash1, hash2).mul(0.8).add(0.2));
            });

            return vec4(color, 1);
        })();

        this.mesh = new InstancedMesh(geometry, material, this.amount);
        this.mesh.frustumCulled = false;
        this.mesh.matrixAutoUpdate = false;
        this.scene.add(this.mesh);

        this.#initEvents();
        this.#initTweakPane();

        /**
         * Lights
         */
        const directionalLightLeft = new DirectionalLight('#b088fa', 2);
        directionalLightLeft.position.x = -10;
        directionalLightLeft.position.y = -2;
        directionalLightLeft.position.z = 10;
        this.scene.add(directionalLightLeft);

        const directionalLightRight = new DirectionalLight('#ff8b8b', 2);
        directionalLightRight.position.x = 15;
        directionalLightRight.position.y = 5;
        directionalLightRight.position.z = 5;
        this.scene.add(directionalLightRight);

        console.log('i');

        /**
         * Post processing
         */

        this.postProcessing = new PostProcessing(this.renderer);

        // Color
        const scenePass = pass(this.scene, this.camera, { anisotropy: 1, samples: 1 });
        scenePass.setMRT(
            mrt({
                output,
                normal: normalView,
            }),
        );

        const scenePassDepth = scenePass.getTextureNode('depth');
        const scenePassNormal = scenePass.getTextureNode('normal');
        const scenePassColor = scenePass.getTextureNode('output');

        // ao
        const aoPass = ao(scenePassDepth, scenePassNormal, this.camera);
        aoPass.resolutionScale = 0.5;
        aoPass.thickness.value = 2;
        aoPass.samples.value = 8;

        const denoisePass = denoise(aoPass.getTextureNode(), scenePassDepth, scenePassNormal, this.camera);

        // Output
        this.postProcessing.outputNode = scenePassColor.mul(denoisePass);
        // this.postProcessing.outputNode = aoPass;

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

        this.tweakPane.addBinding(this.params, 'usePostprocessing');
    }

    #destroyTweakPane() {
        this.tweakPane?.dispose();
    }

    async render() {
        this.stats?.update();
        this.pointerHandler.update();

        this.uniforms.center.value.lerp(this.pointerHandler.uPointer.value, 0.1);

        // this.centerPointLight.position.copy(this.uniforms.center.value);

        if (this.computeAttraction instanceof ComputeNode) {
            this.renderer.computeAsync(this.computeAttraction);
            this.renderer.computeAsync(this.computeCollision);
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
        this.positionsBuffer.dispose();
        this.velocitiesBuffer.dispose();

        if (this.renderer.hasInitialized()) {
            this.renderer.dispose();
        }
    }
}

export default Demo;
