import { damp } from 'maath/easing';
import Stats from 'stats-gl';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Fn, hash, instanceIndex, select, storage, vec3 } from 'three/tsl';
import {
    ACESFilmicToneMapping,
    Clock,
    Mesh,
    PerspectiveCamera,
    Plane,
    Scene,
    StorageInstancedBufferAttribute,
    TimestampQuery,
    Vector3,
    WebGPURenderer,
} from 'three/webgpu';
import { Pane } from 'tweakpane';
import { Pointer } from '@/utils/webgpu/PointerNoDom';
import ParticlesMesh from './ParticlesMesh';

class Demo {
    canvas: HTMLCanvasElement;
    renderer: WebGPURenderer;
    camera: PerspectiveCamera;
    scene: Scene;
    controls?: OrbitControls;
    stats?: Stats;
    clock = new Clock();
    prevTime = 0;
    mesh?: ParticlesMesh;

    pointerHandler: Pointer;

    tweakPane?: Pane;

    constructor(canvas: HTMLCanvasElement) {
        this.render = this.render.bind(this);
        this.onWindowResize = this.onWindowResize.bind(this);

        this.canvas = canvas;
        this.renderer = new WebGPURenderer({
            alpha: true,
            canvas,
            antialias: false,
            powerPreference: 'high-performance',
        });
        this.renderer.toneMapping = ACESFilmicToneMapping;
        this.renderer.setPixelRatio(this.dpr);
        this.renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);

        this.scene = new Scene();

        this.camera = new PerspectiveCamera(64, canvas.width / canvas.height, 0.1, 500);
        this.camera.position.set(0, 0, 5);

        this.pointerHandler = new Pointer(
            this.canvas.offsetWidth,
            this.canvas.offsetHeight,
            this.camera,
            new Plane(new Vector3(0, 0, 1), 0),
        );

        const maxCount = 10000;

        /**
         * Начальные позиции
         */

        const startPositions = storage(new StorageInstancedBufferAttribute(maxCount, 3), 'vec3', maxCount).setPBO(true);

        const computeInitialPositionsNode = Fn(() => {
            startPositions
                .element(instanceIndex)
                .assign(
                    vec3(
                        hash(instanceIndex).sub(0.5).mul(30),
                        hash(instanceIndex.add(1)).sub(0.5).mul(30),
                        hash(instanceIndex.add(2)).negate().mul(30),
                    ),
                );
        })().compute(maxCount);

        this.renderer.computeAsync(computeInitialPositionsNode).then(() => {
            computeInitialPositionsNode.dispose();
        });

        this.mesh = new ParticlesMesh({
            amount: maxCount,
            startPositions,
            renderer: this.renderer,
            pointerPosition: this.pointerHandler.uPointer,
            pointerVelocity: this.pointerHandler.uPointerVelocity,
        });
        this.scene.add(this.mesh);

        if (this.tweakPane) {
            this.mesh.initTweakPane(this.tweakPane);
        }

        if (process.env.NODE_ENV === 'development') {
            this.stats = new Stats({
                precision: 3,
                trackGPU: true,
                trackCPT: true,
            });
            this.stats.init(this.renderer);
            canvas.parentElement?.appendChild(this.stats.dom);
        }

        this.#initEvents();

        if (window.location.search.includes('debug')) {
            this.#initTweakPane();
        }

        this.renderer.setAnimationLoop(this.render);
    }

    get dpr() {
        return Math.min(window.devicePixelRatio, matchMedia('(max-width: 1024px)').matches ? 1 : 1.5);
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

    async render() {
        const elapsedTime = this.clock.getElapsedTime();
        const delta = elapsedTime - this.prevTime;
        this.prevTime = elapsedTime;

        this.pointerHandler.update(delta);

        if (this.mesh) {
            this.mesh.update(delta);
        }

        if (this.stats) {
            this.renderer.resolveTimestampsAsync(TimestampQuery.COMPUTE);
        }

        this.renderer.renderAsync(this.scene, this.camera);

        if (this.stats) {
            this.renderer.resolveTimestampsAsync(TimestampQuery.RENDER);
            this.stats.update();
        }
    }

    destroy() {
        this.renderer.setAnimationLoop(null);

        this.#destroyEvents();
        this.#destroyTweakPane();
        this.controls?.dispose();
        this.stats?.dom.remove();
        this.mesh?.dispose();

        if (this.renderer.hasInitialized()) {
            this.renderer.dispose();
        }
    }

    #initTweakPane() {
        this.tweakPane = new Pane({
            title: 'Parameters',
            expanded: matchMedia('(min-width: 1200px)').matches,
        });

        this.mesh?.initTweakPane(this.tweakPane);
    }

    #destroyTweakPane() {
        this.tweakPane?.dispose();
    }
}

export default Demo;
