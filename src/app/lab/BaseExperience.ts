import Stats from 'stats-gl';
import { WebGPURendererParameters } from 'three/src/renderers/webgpu/WebGPURenderer.js';
import {
    ACESFilmicToneMapping,
    Clock,
    PerspectiveCamera,
    PostProcessing,
    Scene,
    TimestampQuery,
    Vector3,
    WebGPURenderer,
} from 'three/webgpu';
import { Pane } from 'tweakpane';

const position = new Vector3();
const defaultTarget = new Vector3();

class BaseExperience {
    canvas: HTMLCanvasElement;
    renderer: WebGPURenderer;
    camera: PerspectiveCamera;
    scene: Scene;
    stats?: Stats;
    clock = new Clock();
    prevTime = 0;
    delta = 0;
    tweakPane?: Pane;

    viewport = { width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0 };

    constructor(canvas: HTMLCanvasElement, rendererParams: WebGPURendererParameters = {}) {
        this.render = this.render.bind(this);
        this.onWindowResize = this.onWindowResize.bind(this);

        this.canvas = canvas;
        this.renderer = new WebGPURenderer({
            canvas,
            powerPreference: 'high-performance',
            ...rendererParams,
        });
        this.renderer.toneMapping = ACESFilmicToneMapping;
        this.renderer.setPixelRatio(this.dpr);
        this.renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);

        this.scene = new Scene();

        this.camera = new PerspectiveCamera(35, canvas.width / canvas.height, 0.1, 1000);
        this.camera.position.set(0, 0, 5);

        this.viewport = this.getViewport();

        if (process.env.NODE_ENV === 'development') {
            this.stats = new Stats({ precision: 3, trackGPU: true, trackCPT: true });
            this.stats.init(this.renderer);
            canvas.parentElement?.appendChild(this.stats.dom);
        }

        this.initEvents();
        this.renderer.setAnimationLoop(() => this.render());
    }

    get dpr() {
        return Math.min(window.devicePixelRatio, 2);
    }

    private getViewport() {
        const fov = (this.camera.fov * Math.PI) / 180; // convert vertical fov to radians
        const distance = this.camera.getWorldPosition(position).distanceTo(defaultTarget);
        const h = 2 * Math.tan(fov / 2) * distance;
        const aspect = this.canvas.width / this.canvas.height;
        const w = aspect * h;

        return { height: h, width: w, top: h / 2, left: -w / 2, right: w / 2, bottom: -h / 2 };
    }

    onWindowResize() {
        const width = this.canvas.parentElement?.offsetWidth || 1;
        const height = this.canvas.parentElement?.offsetHeight || 1;
        this.renderer.setPixelRatio(this.dpr);
        this.renderer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.viewport = this.getViewport();
    }

    protected initEvents() {
        this.onWindowResize();
        window.addEventListener('resize', this.onWindowResize);
    }

    protected destroyEvents() {
        window.removeEventListener('resize', this.onWindowResize);
    }

    async render(postProcessing?: PostProcessing) {
        const elapsedTime = this.clock.getElapsedTime();
        this.delta = elapsedTime - this.prevTime;
        this.prevTime = elapsedTime;

        if (postProcessing) {
            postProcessing.renderAsync();
        } else {
            this.renderer.renderAsync(this.scene, this.camera);
        }

        if (this.stats) {
            this.renderer.resolveTimestampsAsync(TimestampQuery.RENDER);
            this.stats.update();
        }
    }

    destroy() {
        this.renderer.setAnimationLoop(null);

        this.destroyEvents();
        this.destroyTweakPane();
        this.stats?.dom.remove();

        if (this.renderer.hasInitialized()) {
            this.renderer.dispose();
        }
    }

    protected initTweakPane() {
        this.tweakPane = new Pane({ title: 'Parameters', expanded: matchMedia('(min-width: 1200px)').matches });
    }

    protected destroyTweakPane() {
        this.tweakPane?.dispose();
    }
}

export default BaseExperience;
