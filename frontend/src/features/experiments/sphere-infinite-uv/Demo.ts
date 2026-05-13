import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
    ACESFilmicToneMapping,
    Clock,
    DataTexture,
    DoubleSide,
    Mesh,
    PerspectiveCamera,
    RGBAFormat,
    Scene,
    ShaderMaterial,
    SphereGeometry,
    SRGBColorSpace,
    Texture,
    TextureLoader,
    UnsignedByteType,
    WebGLRenderer,
} from 'three';

const TEXTURE_URL =
    'https://images.unsplash.com/photo-1701122623529-57a0c47e4e0e?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';

const VERTEX_SHADER = /* glsl */ `
varying vec2 vUv;
uniform float uTime;

void main() {
    vUv = uv;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
}
`;

const FRAGMENT_SHADER = /* glsl */ `
varying vec2 vUv;
uniform float uTime;
uniform sampler2D uMap;

void main() {
    vec2 uv = vUv;
    uv.y += uTime * 0.1;
    uv.y = fract(uv.y);

    gl_FragColor = texture2D(uMap, uv);
    #include <colorspace_fragment>
}
`;

class Demo {
    private readonly canvas: HTMLCanvasElement;
    private readonly renderer: WebGLRenderer;
    private readonly scene: Scene;
    private readonly camera: PerspectiveCamera;
    private readonly controls: OrbitControls;
    private readonly clock = new Clock();
    private readonly material: ShaderMaterial;
    private readonly mesh: Mesh<SphereGeometry, ShaderMaterial>;
    private readonly boundResize: () => void;
    private loadedTexture: Texture | null = null;
    private readonly placeholderTexture: DataTexture;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;

        this.renderer = new WebGLRenderer({
            canvas,
            alpha: false,
            antialias: true,
            powerPreference: 'high-performance',
        });
        this.renderer.toneMapping = ACESFilmicToneMapping;
        this.renderer.outputColorSpace = SRGBColorSpace;

        this.scene = new Scene();

        const width = canvas.parentElement?.offsetWidth || 1;
        const height = canvas.parentElement?.offsetHeight || 1;

        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(width, height);

        this.camera = new PerspectiveCamera(45, width / height, 0.1, 1000);
        this.camera.position.set(0, 0, 1.8);

        this.controls = new OrbitControls(this.camera, canvas);
        this.controls.enableDamping = true;

        this.placeholderTexture = new DataTexture(
            new Uint8Array([255, 255, 255, 255]),
            1,
            1,
            RGBAFormat,
            UnsignedByteType,
        );
        this.placeholderTexture.colorSpace = SRGBColorSpace;
        this.placeholderTexture.needsUpdate = true;

        this.material = new ShaderMaterial({
            uniforms: {
                uMap: { value: this.placeholderTexture },
                uTime: { value: 0 },
            },
            vertexShader: VERTEX_SHADER,
            fragmentShader: FRAGMENT_SHADER,
            side: DoubleSide,
        });

        const geometry = new SphereGeometry(0.5, 128, 128);

        this.mesh = new Mesh(geometry, this.material);
        this.scene.add(this.mesh);

        this.boundResize = () => this.onWindowResize();
        window.addEventListener('resize', this.boundResize);

        const loader = new TextureLoader();

        loader.setCrossOrigin('anonymous');
        loader.load(
            TEXTURE_URL,
            (texture) => {
                texture.colorSpace = SRGBColorSpace;
                this.loadedTexture = texture;
                this.material.uniforms.uMap.value = texture;
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
        this.material.uniforms.uTime.value = this.clock.getElapsedTime();
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
        this.loadedTexture?.dispose();

        if (!this.loadedTexture) {
            this.placeholderTexture.dispose();
        }

        this.renderer.dispose();
    }
}

export default Demo;
