import Stats from 'stats-gl';
import { ACESFilmicToneMapping, Clock, PerspectiveCamera, Scene, TimestampQuery, WebGPURenderer } from 'three/webgpu';
import { Pane } from 'tweakpane';

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

        this.camera = new PerspectiveCamera(35, canvas.width / canvas.height, 0.1, 1000);
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

        this.initEvents();
        this.renderer.setAnimationLoop(this.render);
    }

    get dpr() {
        return Math.min(window.devicePixelRatio, 2);
    }

    onWindowResize() {
        const width = this.canvas.parentElement?.offsetWidth || 1;
        const height = this.canvas.parentElement?.offsetHeight || 1;
        this.renderer.setPixelRatio(this.dpr);
        this.renderer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }

    protected initEvents() {
        window.addEventListener('resize', this.onWindowResize);
    }

    protected destroyEvents() {
        window.removeEventListener('resize', this.onWindowResize);
    }

    async render() {
        const elapsedTime = this.clock.getElapsedTime();
        this.delta = elapsedTime - this.prevTime;
        this.prevTime = elapsedTime;

        this.renderer.renderAsync(this.scene, this.camera);

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
        this.tweakPane = new Pane({
            title: 'Parameters',
            expanded: matchMedia('(min-width: 1200px)').matches,
        });
    }

    protected destroyTweakPane() {
        this.tweakPane?.dispose();
    }
}

export default BaseExperience;
