import {
    Clock,
    Color,
    Mesh,
    NoToneMapping,
    PerspectiveCamera,
    SRGBColorSpace,
    Scene,
    ShaderMaterial,
    TorusGeometry,
    WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ExperimentBackground } from '../lib/ExperimentBackground';
import fragmentShader from './shaders/fragment.glsl?raw';
import vertexShader from './shaders/vertex.glsl?raw';

class Demo {
    private readonly canvas: HTMLCanvasElement;
    private readonly renderer: WebGLRenderer;
    private readonly scene: Scene;
    private readonly camera: PerspectiveCamera;
    private readonly controls: OrbitControls;
    private readonly clock = new Clock();
    private readonly material: ShaderMaterial;
    private readonly mesh: Mesh<TorusGeometry, ShaderMaterial>;
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

        const radial = isMobile ? 160 : 512;
        const tubular = isMobile ? 160 : 512;
        const geometry = new TorusGeometry(1, 0.3, radial, tubular);

        this.material = new ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
            },
            vertexShader,
            fragmentShader,
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
