import Stats from 'stats-gl';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
    ACESFilmicToneMapping,
    BoxGeometry,
    Mesh,
    MeshStandardNodeMaterial,
    PerspectiveCamera,
    PointLight,
    Scene,
    WebGPURenderer,
} from 'three/webgpu';
import { Pane } from 'tweakpane';
import Water from './Water';

class Demo {
    canvas: HTMLCanvasElement;
    renderer: WebGPURenderer;
    camera: PerspectiveCamera;
    scene: Scene;
    controls?: OrbitControls;
    stats: Stats;
    mesh: Mesh;
    light: PointLight;

    #touchStart = {
        x: 0,
        y: 0,
        cameraX: 0,
        cameraZ: 0,
    };

    tweakPane = new Pane();

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
        this.renderer = new WebGPURenderer({ canvas, antialias: true });
        this.renderer.toneMapping = ACESFilmicToneMapping;
        this.renderer.setPixelRatio(this.dpr);
        this.renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);

        this.scene = new Scene();

        this.camera = new PerspectiveCamera(45, canvas.width / canvas.height, 0.1, 1000);
        this.camera.position.set(0, 0.5, 0);

        this.stats = new Stats({
            trackGPU: true,
        });
        this.stats.init(this.renderer);
        canvas.parentElement?.appendChild(this.stats.dom);

        // this.controls = new OrbitControls(this.camera, this.renderer.domElement);

        this.#initEvents();
        this.#initTweakPane();
        this.renderer.setAnimationLoop(this.render);

        this.mesh = new Water(this.scene);
        this.scene.add(this.mesh);

        const geometry = new BoxGeometry(1, 1, 1);
        const material = new MeshStandardNodeMaterial({ color: 'red' });
        const cube = new Mesh(geometry, material);
        cube.position.y = 0.8;
        cube.position.z = -5;
        this.scene.add(cube);
        this.light = new PointLight(0xffffff, 10, 50, 1);
        this.light.position.set(0, 3, 3);
        this.scene.add(this.light);

        document.documentElement.style.overscrollBehavior = 'none';
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

    #initTweakPane() {
        this.tweakPane = new Pane();

        // this.tweakPane.addBinding(this.params, 'position').on('change', (event) => {
        //     this.mesh.position.set(event.value.x, event.value.y, event.value.z);
        //     this.camera.position.x = event.value.x;
        //     this.camera.position.z = 5 + event.value.z;
        // });

        // this.tweakPane.addBinding(this.params, 'count', { min: 0, max: 50000, step: 1 });

        // this.tweakPane.addBinding(this.params, 'pointSize', { min: 0, max: 50, step: 0.001 }).on('change', (event) => {
        //     this.uniforms.pointSize.value = event.value;
        // });
    }

    #destroyTweakPane() {
        this.tweakPane.dispose();
    }

    async render() {
        this.stats.update();
        await this.renderer.renderAsync(this.scene, this.camera);
    }

    destroy() {
        this.#destroyEvents();
        this.#destroyTweakPane();
        this.controls?.dispose();
        this.stats.dom.remove();
        this.renderer.dispose();
    }
}

export default Demo;
