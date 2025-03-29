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
    hash,
    instanceIndex,
    length,
    max,
    mrt,
    mx_fractal_noise_vec3,
    normalView,
    not,
    output,
    pass,
    positionLocal,
    screenUV,
    storage,
    time,
    uint,
    uniform,
    vec3,
    vec4,
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
    TimestampQuery,
    Vector3,
    WebGPURenderer,
} from 'three/webgpu';
import { Pane } from 'tweakpane';
import { rotationXYZ } from '@/app/tsl-utils/rotation/rotation-xyz';
import { Pointer } from '@/utils/webgpu/Pointer';
import { compose } from '@/utils/webgpu/nodes/compose';

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
    amount = 600;
    pointerHandler: Pointer;

    positionsBuffer: ShaderNodeObject<StorageBufferNode>;
    velocitiesBuffer: ShaderNodeObject<StorageBufferNode>;

    computeAttractions: ComputeNode;
    computeСollisions: ComputeNode;

    params = {
        usePostprocessing: true,
    };

    uniforms = {
        attractorPosition: uniform(new Vector3(0)),
    };

    constructor(canvas: HTMLCanvasElement) {
        this.render = this.render.bind(this);
        this.onWindowResize = this.onWindowResize.bind(this);

        this.canvas = canvas;
        this.renderer = new WebGPURenderer({
            canvas,
            powerPreference: 'high-performance',
            antialias: !this.params.usePostprocessing,
            // forceWebGL: true,
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
                precision: 3,
                trackGPU: true,
                trackCPT: true,
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
        this.velocitiesBuffer = storage(new StorageInstancedBufferAttribute(this.amount, 4), 'vec4', this.amount);

        const geometry = new SphereGeometry(1, 32, 32);
        geometry.deleteAttribute('uv');

        const attractorPosition = uniform(new Vector3(0));
        this.uniforms.attractorPosition = attractorPosition;
        const size = uniform(0.12);
        const attractorSize = uniform(8);
        const maxVelocity = uniform(0.04);
        const isAttractor = instanceIndex.equal(0);

        const hash0 = Var(hash(instanceIndex), 'hash0');
        const hash1 = Var(hash(instanceIndex.add(1)), 'hash1');
        const hash2 = Var(hash(instanceIndex.add(2)), 'hash2');
        const hash3 = Var(hash(instanceIndex.add(3)), 'hash3');
        const hash4 = Var(hash(instanceIndex.add(4)), 'hash4');
        const hash5 = Var(hash(instanceIndex.add(5)), 'hash5');

        const initCompute = Fn(() => {
            const position = this.positionsBuffer.element(instanceIndex);
            const velocity = this.velocitiesBuffer.element(instanceIndex);

            velocity.xyz.assign(0);

            If(isAttractor, () => {
                position.xyz.assign(attractorPosition);
                position.w.assign(attractorSize);
                velocity.w.assign(0);
            }).Else(() => {
                position.xyz.assign(vec3(hash0.sub(0.5).mul(20), hash3.sub(0.5).mul(20), hash5.sub(0.5).mul(20)));
                position.w.assign(hash4.mul(0.3).add(0.7));
                velocity.w.assign(1);
            });
        })().compute(this.amount);

        this.renderer.computeAsync(initCompute);

        this.computeAttractions = Fn(() => {
            const position = this.positionsBuffer.element(instanceIndex);
            const velocity = this.velocitiesBuffer.element(instanceIndex);

            /**
             * Read from buffers
             */

            const pos = position.xyz.toVar('pos');
            const vel = velocity.xyz.toVar('vel');

            const clampedDeltaTime = deltaTime.min(0.02).toVar();

            If(not(isAttractor), () => {
                const toAttractorVec = attractorPosition.sub(pos.xyz).toVar('toAttractorVec');
                const objSize = pos.w.mul(size).toVar('objSize');
                const intensity = max(objSize.mul(objSize), 0.1);
                vel.xyz.addAssign(toAttractorVec.normalize().mul(clampedDeltaTime).mul(intensity));
                vel.xyz.minAssign(maxVelocity);
                vel.xyz.mulAssign(0.999);
                pos.addAssign(vel.mul(clampedDeltaTime.mul(60)));
            }).Else(() => {
                pos.assign(attractorPosition);
            });

            /**
             * Write back to buffers
             */

            position.xyz.assign(pos);
            velocity.xyz.assign(vel);
        })().compute(this.amount);

        this.computeСollisions = Fn(() => {
            const position = this.positionsBuffer.element(instanceIndex);
            const velocity = this.velocitiesBuffer.element(instanceIndex);
            const count = uint(this.amount);

            Loop({ start: uint(0), end: count, type: 'uint', condition: '<' }, ({ i }) => {
                If(uint(i).notEqual(instanceIndex), () => {
                    const neighbourPosition = this.positionsBuffer.element(i);
                    const toNeighbourVec = Var(neighbourPosition.xyz.sub(position.xyz), 'toNeighbourVec');
                    const distance = Var(length(toNeighbourVec), 'dist');
                    const minDistance = Var(position.w.mul(size).add(neighbourPosition.w.mul(size)), 'minDist');

                    If(distance.lessThan(minDistance).and(not(isAttractor)), () => {
                        const toNeighbourDirection = toNeighbourVec.normalize();
                        const diff = minDistance.sub(distance);
                        const correction = Var(toNeighbourDirection.mul(diff.mul(0.5)), 'correction');
                        const velocityCorrection = correction.mul(max(length(velocity), 2));

                        position.xyz.subAssign(correction);
                        velocity.xyz.subAssign(velocityCorrection);
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

        /**
         * Post processing
         */

        this.postProcessing = new PostProcessing(this.renderer);

        // Color
        const scenePass = pass(this.scene, this.camera);
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
        this.pointerHandler.update();
        this.uniforms.attractorPosition.value.lerp(this.pointerHandler.uPointer.value, 0.1);

        if (this.computeAttractions instanceof ComputeNode) {
            await this.renderer.computeAsync(this.computeAttractions);
        }

        if (this.computeСollisions instanceof ComputeNode) {
            await this.renderer.computeAsync(this.computeСollisions);
        }

        if (this.stats) {
            this.renderer.resolveTimestampsAsync(TimestampQuery.COMPUTE);
        }

        if (this.params.usePostprocessing) {
            await this.postProcessing.renderAsync();
        } else {
            await this.renderer.renderAsync(this.scene, this.camera);
        }

        if (this.stats) {
            this.renderer.resolveTimestampsAsync();
            this.stats.update();
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
