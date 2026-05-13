import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
    Clock,
    Color,
    IcosahedronGeometry,
    Mesh,
    NoToneMapping,
    PerspectiveCamera,
    Scene,
    ShaderMaterial,
    SRGBColorSpace,
    WebGLRenderer,
} from 'three';
import { ExperimentBackground } from '../lib/ExperimentBackground';
import { FRAGMENT_SHADER, VERTEX_SHADER } from './displacedSphereShaders';

class Demo {
    private readonly canvas: HTMLCanvasElement;
    private readonly renderer: WebGLRenderer;
    private readonly scene: Scene;
    private readonly camera: PerspectiveCamera;
    private readonly controls: OrbitControls;
    private readonly clock = new Clock();
    private readonly material: ShaderMaterial;
    private readonly mesh: Mesh<IcosahedronGeometry, ShaderMaterial>;
    private readonly experimentBackground: ExperimentBackground;
    private readonly boundResize: () => void;

    constructor(canvas: HTMLCanvasElement, isMobile: boolean) {
        this.canvas = canvas;

        this.renderer = new WebGLRenderer({
            canvas,
            alpha: false,
            antialias: true,
            powerPreference: 'high-performance',
        });
        this.renderer.toneMapping = NoToneMapping;
        this.renderer.outputColorSpace = SRGBColorSpace;

        this.scene = new Scene();
        this.scene.background = new Color(0xa6a6a6);

        const width = canvas.parentElement?.offsetWidth || 1;
        const height = canvas.parentElement?.offsetHeight || 1;

        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(width, height);

        this.camera = new PerspectiveCamera(45, width / height, 0.1, 1000);
        this.camera.position.set(0, 0, isMobile ? 9 : 5);

        this.controls = new OrbitControls(this.camera, canvas);
        this.controls.enableDamping = true;

        const detail = isMobile ? 48 : 64;
        const geometry = new IcosahedronGeometry(1.2, detail);

        this.material = new ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
            },
            vertexShader: VERTEX_SHADER,
            fragmentShader: FRAGMENT_SHADER,
            toneMapped: false,
        });

        this.mesh = new Mesh(geometry, this.material);
        this.scene.add(this.mesh);

        this.experimentBackground = new ExperimentBackground();
        this.scene.add(this.experimentBackground);

        this.boundResize = () => this.onWindowResize();
        window.addEventListener('resize', this.boundResize);

        this.renderer.setAnimationLoop(() => this.renderFrame());
    }

    private renderFrame() {
        this.controls.update();
        const elapsedTime = this.clock.getElapsedTime();

        this.material.uniforms.uTime.value = elapsedTime;
        this.experimentBackground.update(elapsedTime);
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        const width = this.canvas.parentElement?.offsetWidth || 1;
        const height = this.canvas.parentElement?.offsetHeight || 1;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(width, height);
    }

    destroy() {
        window.removeEventListener('resize', this.boundResize);
        this.renderer.setAnimationLoop(null);
        this.controls.dispose();
        this.scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.material.dispose();
        this.scene.remove(this.experimentBackground);
        this.experimentBackground.dispose();
        this.renderer.dispose();
    }
}

export default Demo;
