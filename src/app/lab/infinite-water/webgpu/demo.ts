import Stats from 'stats-gl';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { vec4 } from 'three/tsl';
import { ACESFilmicToneMapping, Mesh, PerspectiveCamera, PointLight, Scene, WebGPURenderer } from 'three/webgpu';
import Water from './Water';

class Demo {
    canvas: HTMLCanvasElement;
    renderer: WebGPURenderer;
    camera: PerspectiveCamera;
    scene: Scene;
    controls?: OrbitControls;
    stats?: Stats;
    mesh: Mesh;
    light: PointLight;

    #touchStart = {
        x: 0,
        y: 0,
        cameraX: 0,
        cameraZ: 0,
    };

    params = {
        position: { x: 0, y: 0, z: 0 },
    };

    uniforms = {};

    constructor(canvas: HTMLCanvasElement) {
        this.render = this.render.bind(this);
        this.onWindowResize = this.onWindowResize.bind(this);
        this.onWheel = this.onWheel.bind(this);
        this.onTouchStart = this.onTouchStart.bind(this);
        this.onTouchMove = this.onTouchMove.bind(this);

        this.canvas = canvas;
        this.renderer = new WebGPURenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
        this.renderer.toneMapping = ACESFilmicToneMapping;
        this.renderer.setPixelRatio(this.dpr);
        this.renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);

        this.scene = new Scene();
        this.scene.backgroundNode = vec4(0, 0, 0, 1);

        this.camera = new PerspectiveCamera(45, canvas.width / canvas.height, 0.1, 1000);
        this.camera.position.set(0, 0.5, 0);

        if (process.env.NODE_ENV === 'development') {
            this.stats = new Stats({
                trackGPU: true,
            });
            this.stats.init(this.renderer);
            canvas.parentElement?.appendChild(this.stats.dom);
        }

        this.#initEvents();
        this.renderer.setAnimationLoop(this.render);

        this.mesh = new Water();
        this.scene.add(this.mesh);

        this.light = new PointLight(0xffffff, 10, 50, 1);
        this.light.position.set(0, 3, 3);
        this.scene.add(this.light);

        document.documentElement.style.overscrollBehavior = 'none';
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
    }

    #onCameraMove() {
        this.mesh.position.x = this.camera.position.x;
        this.mesh.position.z = this.camera.position.z;
        this.light.position.x = this.camera.position.x;
        this.light.position.z = 3 + this.camera.position.z;
    }

    onWheel(event: WheelEvent) {
        this.camera.position.x += event.deltaX * 0.003;
        this.camera.position.z += event.deltaY * 0.003;
        this.#onCameraMove();
    }

    onTouchStart(event: TouchEvent) {
        this.#touchStart.x = event.touches[0].clientX;
        this.#touchStart.y = event.touches[0].clientY;
        this.#touchStart.cameraX = this.camera.position.x;
        this.#touchStart.cameraZ = this.camera.position.z;
    }

    onTouchMove(event: TouchEvent) {
        const x = event.touches[0].clientX;
        const deltaX = (x - this.#touchStart.x) * 0.03;
        this.camera.position.x = this.#touchStart.cameraX - deltaX;

        const y = event.touches[0].clientY;
        const deltaY = (y - this.#touchStart.y) * 0.03;
        this.camera.position.z = this.#touchStart.cameraZ - deltaY;

        this.#onCameraMove();
    }

    #initEvents() {
        window.addEventListener('resize', this.onWindowResize);
        window.addEventListener('wheel', this.onWheel);
        this.canvas.addEventListener('touchstart', this.onTouchStart);
        this.canvas.addEventListener('touchmove', this.onTouchMove);
    }

    #destroyEvents() {
        window.removeEventListener('resize', this.onWindowResize);
        window.removeEventListener('wheel', this.onWheel);
        this.canvas.removeEventListener('touchstart', this.onTouchStart);
        this.canvas.removeEventListener('touchmove', this.onTouchMove);
    }

    async render() {
        this.stats?.update();
        await this.renderer.renderAsync(this.scene, this.camera);
    }

    destroy() {
        this.renderer.setAnimationLoop(null);

        this.#destroyEvents();
        this.controls?.dispose();
        this.stats?.dom.remove();
        this.renderer.dispose();
    }
}

export default Demo;
