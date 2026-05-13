import Stats from 'stats-gl';
import { type WebGPURendererParameters } from 'three/src/renderers/webgpu/WebGPURenderer.js';
import {
    ACESFilmicToneMapping,
    PerspectiveCamera,
    RenderPipeline,
    Scene,
    Timer,
    TimestampQuery,
    Vector3,
    WebGPURenderer,
} from 'three/webgpu';
import { Pane } from 'tweakpane';

const position = new Vector3();
const defaultTarget = new Vector3();

class BaseExperience {
    protected disposed = false;
    // Serializes animation callbacks. Three's loop does not await async `render()`.
    private renderChain: Promise<void> = Promise.resolve();

    canvas: HTMLCanvasElement;
    renderer: WebGPURenderer;
    camera: PerspectiveCamera;
    scene: Scene;
    stats?: Stats;
    clock = new Timer();
    prevTime = 0;
    delta = 0;
    tweakPane?: Pane;

    viewport = { width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0 };

    constructor(canvas: HTMLCanvasElement, rendererParams: WebGPURendererParameters = {}) {
        this.render = this.render.bind(this);
        this.onWindowResize = this.onWindowResize.bind(this);

        this.clock.connect(document);

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
            this.stats = new Stats({ trackGPU: true, trackCPT: true });
            this.stats.domElement.classList.add('stats-gl');
            this.stats.init(this.renderer);
            canvas.parentElement?.appendChild(this.stats.dom);
        }

        this.initEvents();
        this.renderer.setAnimationLoop(() => {
            this.renderChain = this.renderChain.then(() => Promise.resolve(this.render())).catch(() => {});
        });
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

    render(postProcessing?: RenderPipeline) {
        if (this.disposed) {
            return;
        }

        this.clock.update();
        const elapsedTime = this.clock.getElapsed();

        this.delta = elapsedTime - this.prevTime;
        this.prevTime = elapsedTime;

        if (postProcessing) {
            postProcessing.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }

        if (this.stats) {
            this.renderer.resolveTimestampsAsync(TimestampQuery.RENDER);
            this.stats.update();
        }
    }

    destroy() {
        if (this.disposed) {
            return;
        }
        this.disposed = true;

        this.clock.disconnect();
        this.renderer.setAnimationLoop(null);
        this.destroyEvents();

        const hadStats = this.stats !== undefined;

        if (this.stats) {
            this.stats.dispose();
            this.stats = undefined;
        }

        this.destroyTweakPane();

        this.disposeRendererSafely(hadStats);
    }

    private async disposeRendererSafely(hadStats: boolean): Promise<void> {
        if (!this.renderer.hasInitialized()) {
            return;
        }

        await this.renderChain.catch(() => {});

        if (hadStats) {
            try {
                await Promise.all([
                    this.renderer.resolveTimestampsAsync(TimestampQuery.RENDER),
                    this.renderer.resolveTimestampsAsync(TimestampQuery.COMPUTE),
                ]);
            } catch {
                // in-flight readback may abort during route change
            }
        }

        this.renderer.dispose();
    }

    protected initTweakPane() {
        this.tweakPane = new Pane({ title: 'Parameters', expanded: matchMedia('(min-width: 1200px)').matches });
    }

    protected destroyTweakPane() {
        this.tweakPane?.dispose();
        this.tweakPane = undefined;
    }
}

export default BaseExperience;
