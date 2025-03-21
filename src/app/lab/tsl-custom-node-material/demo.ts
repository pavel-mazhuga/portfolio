import Stats from 'stats-gl';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { mx_noise_float, positionLocal, time, vec3 } from 'three/tsl';
import {
    ACESFilmicToneMapping,
    BufferGeometry,
    DirectionalLight,
    Mesh,
    NodeMaterial,
    PerspectiveCamera,
    Scene,
    SphereGeometry,
    TimestampQuery,
    WebGPURenderer,
} from 'three/webgpu';
import { Pane } from 'tweakpane';
import { CustomNodeMaterial } from './custom-node-material';

class Demo {
    canvas: HTMLCanvasElement;
    renderer: WebGPURenderer;
    camera: PerspectiveCamera;
    scene: Scene;
    controls?: OrbitControls;
    stats?: Stats;
    mesh: Mesh<BufferGeometry, NodeMaterial>;
    tweakPane?: Pane;

    params = {};

    uniforms = {};

    constructor(canvas: HTMLCanvasElement) {
        this.render = this.render.bind(this);
        this.onWindowResize = this.onWindowResize.bind(this);

        this.canvas = canvas;
        this.renderer = new WebGPURenderer({
            canvas,
            powerPreference: 'high-performance',
            antialias: true,
            // forceWebGL: true,
        });
        this.renderer.toneMapping = ACESFilmicToneMapping;
        this.renderer.setPixelRatio(this.dpr);
        this.renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);

        this.scene = new Scene();

        this.camera = new PerspectiveCamera(45, canvas.width / canvas.height, 0.1, 1000);
        this.camera.position.set(0, 0, 5);

        if (process.env.NODE_ENV === 'development') {
            this.stats = new Stats({
                precision: 3,
                trackGPU: true,
            });
            this.stats.init(this.renderer);
            canvas.parentElement?.appendChild(this.stats.dom);
        }

        this.controls = new OrbitControls(this.camera, this.canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.1;

        const geometry = new SphereGeometry(1, 256, 256);

        /**
         * Balls
         */

        const material = new CustomNodeMaterial({
            roughness: 0.4,
            metalness: 0,
        });
        material.speed.value = -0.1;

        material.colorNode = vec3(mx_noise_float(positionLocal.xy.add(time.mul(material.speed.mul(2).negate()))));

        this.mesh = new Mesh(geometry, material);
        this.scene.add(this.mesh);

        this.#initEvents();
        // this.#initTweakPane();

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
        this.camera.position.z = matchMedia('(max-width: 1024px)').matches ? 8 : 5;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.controls?.update();
    }

    #initEvents() {
        this.onWindowResize();
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
    }

    #destroyTweakPane() {
        this.tweakPane?.dispose();
    }

    async render() {
        if (this.stats) {
            this.renderer.resolveTimestampsAsync(TimestampQuery.COMPUTE);
        }

        this.renderer.renderAsync(this.scene, this.camera);

        if (this.stats) {
            this.renderer.resolveTimestampsAsync();
            this.stats.update();
        }
    }

    destroy() {
        this.renderer.setAnimationLoop(null);

        this.#destroyEvents();
        // this.#destroyTweakPane();
        this.controls?.dispose();
        this.stats?.dom.remove();
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();

        if (this.renderer.hasInitialized()) {
            this.renderer.dispose();
        }
    }
}

export default Demo;
