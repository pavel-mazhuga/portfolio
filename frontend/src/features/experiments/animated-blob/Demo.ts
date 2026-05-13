import {
    Clock,
    DataTexture,
    IcosahedronGeometry,
    Mesh,
    NoToneMapping,
    PerspectiveCamera,
    RGBAFormat,
    SRGBColorSpace,
    Scene,
    ShaderMaterial,
    Texture,
    TextureLoader,
    UnsignedByteType,
    WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FRAGMENT_SHADER, VERTEX_SHADER } from './animatedBlobShaders';

class Demo {
    private readonly canvas: HTMLCanvasElement;
    private readonly renderer: WebGLRenderer;
    private readonly scene: Scene;
    private readonly camera: PerspectiveCamera;
    private readonly controls: OrbitControls;
    private readonly clock = new Clock();
    private readonly material: ShaderMaterial;
    private readonly mesh: Mesh<IcosahedronGeometry, ShaderMaterial>;
    private readonly boundResize: () => void;
    private matcapTexture: Texture | null = null;
    private readonly placeholderTexture: DataTexture;

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

        const width = canvas.parentElement?.offsetWidth || 1;
        const height = canvas.parentElement?.offsetHeight || 1;

        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(width, height);

        this.camera = new PerspectiveCamera(45, width / height, 0.1, 1000);
        this.camera.position.set(0, 0, isMobile ? 9 : 5);

        this.controls = new OrbitControls(this.camera, canvas);
        this.controls.enableDamping = true;

        this.placeholderTexture = new DataTexture(
            new Uint8Array([200, 200, 255, 255]),
            1,
            1,
            RGBAFormat,
            UnsignedByteType,
        );
        this.placeholderTexture.colorSpace = SRGBColorSpace;
        this.placeholderTexture.needsUpdate = true;

        const detail = isMobile ? 48 : 60;
        const geometry = new IcosahedronGeometry(1, detail);

        this.material = new ShaderMaterial({
            uniforms: {
                u_time: { value: 0 },
                u_amplitude: { value: 0.7 },
                u_frequency: { value: 2 },
                u_offset: { value: 0 },
                u_matCapMap: { value: this.placeholderTexture },
            },
            vertexShader: VERTEX_SHADER,
            fragmentShader: FRAGMENT_SHADER,
            toneMapped: false,
        });

        this.mesh = new Mesh(geometry, this.material);
        this.scene.add(this.mesh);

        this.boundResize = () => this.onWindowResize();
        window.addEventListener('resize', this.boundResize);

        const loader = new TextureLoader();

        loader.load(
            '/static/img/glowy.png',
            (texture) => {
                texture.colorSpace = SRGBColorSpace;
                this.matcapTexture = texture;
                this.material.uniforms.u_matCapMap.value = texture;
                this.placeholderTexture.dispose();
            },
            undefined,
            () => {
                // keep placeholder on failure
            },
        );

        this.renderer.setAnimationLoop(() => this.renderFrame());
    }

    private renderFrame() {
        this.controls.update();
        this.material.uniforms.u_time.value = this.clock.getElapsedTime();
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

        if (this.matcapTexture) {
            this.matcapTexture.dispose();
        } else {
            this.placeholderTexture.dispose();
        }

        this.renderer.dispose();
    }
}

export default Demo;
