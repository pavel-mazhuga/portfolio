import {
    ACESFilmicToneMapping,
    DataTexture,
    Mesh,
    PerspectiveCamera,
    PlaneGeometry,
    RGBAFormat,
    Scene,
    ShaderMaterial,
    SRGBColorSpace,
    Texture,
    TextureLoader,
    UnsignedByteType,
    Vector2,
    WebGLRenderer,
} from 'three';
import { Pane } from 'tweakpane';

const IMAGE_URL =
    'https://images.unsplash.com/photo-1592853598064-5a7fa150592c?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';

const VERTEX_SHADER = /* glsl */ `
uniform float uProgress;
uniform float uRadius;

varying vec2 vUv;
varying float vPosZ;

void main() {
    vUv = uv;
    vec2 center = uv - 0.5;
    float radius = uRadius;
    vec4 pos = vec4(position, 1.0);
    pos.z += (1. - smoothstep(0.3, 0.6, length(center) * (radius - uProgress * radius)) - (1. - smoothstep(0.2, 0.4, length(center) * (radius - uProgress * radius)))) * 0.15 * uProgress;
    vPosZ = pos.z;

    gl_Position = projectionMatrix * modelViewMatrix * pos;
}
`;

const FRAGMENT_SHADER = /* glsl */ `
uniform vec2 planeSize;
uniform vec2 sizeImage;
uniform sampler2D image;

varying vec2 vUv;
varying float vPosZ;

vec2 coverTextureUv(vec2 imgSize, vec2 planeSz, vec2 ouv) {
    vec2 s = planeSz;
    vec2 i = imgSize;
    float rs = s.x / s.y;
    float ri = i.x / i.y;
    vec2 covered = rs < ri ? vec2(i.x * s.y / i.y, s.y) : vec2(s.x, i.y * s.x / i.x);
    vec2 offset = (rs < ri ? vec2((covered.x - s.x) / 2.0, 0.0) : vec2(0.0, (covered.y - s.y) / 2.0)) / covered;
    vec2 uv = ouv * s / covered + offset;
    return uv;
}

void main() {
    vec2 uv = coverTextureUv(sizeImage, planeSize, vUv);
    gl_FragColor = texture2D(image, uv);
    gl_FragColor.rgb *= 1.0 - smoothstep(1.0, -4.0, vPosZ);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
`;

type VertexWaveParams = {
    progress: number;
    area: number;
};

class Demo {
    private readonly canvas: HTMLCanvasElement;
    private readonly renderer: WebGLRenderer;
    private readonly scene: Scene;
    private readonly camera: PerspectiveCamera;
    private readonly material: ShaderMaterial;
    private readonly mesh: Mesh<PlaneGeometry, ShaderMaterial>;
    private readonly boundResize: () => void;
    private readonly params: VertexWaveParams;
    private readonly tweakPane: Pane;
    private loadedTexture: Texture | null = null;
    private placeholderTexture: DataTexture;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.params = { progress: 0, area: 5 };

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
                image: { value: this.placeholderTexture },
                sizeImage: { value: new Vector2(1, 1) },
                planeSize: { value: new Vector2(1, 1) },
                uProgress: { value: this.params.progress },
                uRadius: { value: this.params.area },
            },
            vertexShader: VERTEX_SHADER,
            fragmentShader: FRAGMENT_SHADER,
        });

        const geometry = new PlaneGeometry(1, 1, 256, 256);

        this.mesh = new Mesh(geometry, this.material);
        this.mesh.rotation.x = -Math.PI / 3;
        this.mesh.scale.setScalar(1.4);
        this.scene.add(this.mesh);

        this.boundResize = () => this.onWindowResize();
        window.addEventListener('resize', this.boundResize);

        this.tweakPane = new Pane({ title: 'Vertex wave', expanded: matchMedia('(min-width: 1200px)').matches });
        this.tweakPane.addBinding(this.params, 'progress', { min: 0, max: 1, step: 0.001 }).on('change', () => {
            this.material.uniforms.uProgress.value = this.params.progress;
        });
        this.tweakPane.addBinding(this.params, 'area', { min: 0, max: 20, step: 0.001 }).on('change', () => {
            this.material.uniforms.uRadius.value = this.params.area;
        });

        const loader = new TextureLoader();

        loader.load(
            IMAGE_URL,
            (texture) => {
                texture.colorSpace = SRGBColorSpace;
                this.loadedTexture = texture;
                this.material.uniforms.image.value = texture;
                this.material.uniforms.sizeImage.value.set(texture.image.naturalWidth, texture.image.naturalHeight);
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
        this.tweakPane.dispose();
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
