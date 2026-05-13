import {
    ACESFilmicToneMapping,
    Clock,
    Color,
    Mesh,
    PerspectiveCamera,
    PlaneGeometry,
    SRGBColorSpace,
    Scene,
    ShaderMaterial,
    Texture,
    TextureLoader,
    Vector2,
    WebGLRenderer,
} from 'three';
import { Pane } from 'tweakpane';
import { ExperimentBackground } from '../lib/ExperimentBackground';

export const TEXTURE_URL_1 =
    'https://images.unsplash.com/photo-1598092655914-44f06584e31a?q=80&w=3052&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';

export const TEXTURE_URL_2 =
    'https://images.unsplash.com/photo-1551554781-c46200ea959d?q=80&w=3000&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';

export type ImageTransitionParams = {
    progress: number;
    waveSpeed: number;
    rippleStrength: number;
    fadeOffset: number;
    innerRippleSpeed: number;
};

const defaultParams = (): ImageTransitionParams => ({
    progress: 0,
    waveSpeed: 4,
    rippleStrength: 2,
    fadeOffset: 0.2,
    innerRippleSpeed: 2,
});

const VERTEX_SHADER = /* glsl */ `
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAGMENT_SHADER = /* glsl */ `
vec2 coverTextureUv(vec2 imgSize, vec2 planeSize, vec2 ouv) {
    vec2 s = planeSize;
    vec2 i = imgSize;
    float rs = s.x / s.y;
    float ri = i.x / i.y;
    vec2 newDims = rs < ri ? vec2(i.x * s.y / i.y, s.y) : vec2(s.x, i.y * s.x / i.x);
    vec2 offset = (rs < ri ? vec2((newDims.x - s.x) / 2.0, 0.0) : vec2(0.0, (newDims.y - s.y) / 2.0)) / newDims;
    return ouv * s / newDims + offset;
}

vec4 coverTexture(sampler2D tex, vec2 imgSize, vec2 planeSize, vec2 ouv) {
    return texture(tex, coverTextureUv(imgSize, planeSize, ouv));
}

float remap(float value, float in_min, float in_max, float out_min, float out_max) {
    float mapped = ((value - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
    return clamp(mapped, out_min, out_max);
}

uniform vec2 uPlaneSize;

uniform sampler2D uCurrentImage;
uniform vec2 uCurrentImageSize;

uniform sampler2D uNextImage;
uniform vec2 uNextImageSize;

uniform float uTime;
uniform float uProgress;
uniform float uWaveSpeed;
uniform float uRippleStrength;
uniform float uFadeOffset;
uniform float uInnerRippleSpeed;

varying vec2 vUv;

void main() {
    vec2 uv = vUv;
    vec2 center = uv - 0.5;
    float len = length(center);
    vec2 ripple = uv + center / len * 0.03 * cos(len * 12.0 - uTime * uWaveSpeed) * (0.5 - abs(uProgress - 0.5)) * uRippleStrength;
    vec2 modifiedUv = mix(ripple, uv, 0.0);

    vec4 color1 = coverTexture(uCurrentImage, uCurrentImageSize, uPlaneSize, modifiedUv);
    vec4 color2 = coverTexture(uNextImage, uNextImageSize, uPlaneSize, modifiedUv);
    float fade = smoothstep(uProgress - uFadeOffset, remap(uProgress, 0.0, 1.0, -uFadeOffset, 1.0 - uFadeOffset) + uFadeOffset, len);

    gl_FragColor = mix(color1, color2, clamp(0.0, 1.0, fade + length(modifiedUv - uv) * uInnerRippleSpeed));
    #include <colorspace_fragment>
}
`;

type DemoOptions = {
    onReady?: () => void;
};

class ImageTransitionDemo {
    private readonly canvas: HTMLCanvasElement;
    private readonly renderer: WebGLRenderer;
    private readonly scene: Scene;
    private readonly camera: PerspectiveCamera;
    private readonly clock = new Clock();
    private readonly boundResize: () => void;
    private readonly params: ImageTransitionParams;
    private material: ShaderMaterial | null = null;
    private mesh: Mesh<PlaneGeometry, ShaderMaterial> | null = null;
    private textures: Texture[] = [];
    private tweakPane?: Pane;
    private readonly experimentBackground: ExperimentBackground;

    constructor(canvas: HTMLCanvasElement, options?: DemoOptions) {
        this.canvas = canvas;
        this.params = defaultParams();

        this.renderer = new WebGLRenderer({
            canvas,
            alpha: false,
            antialias: true,
            powerPreference: 'high-performance',
        });
        this.renderer.toneMapping = ACESFilmicToneMapping;
        this.renderer.outputColorSpace = SRGBColorSpace;

        this.scene = new Scene();
        this.scene.background = new Color(0xa6a6a6);

        const width = canvas.parentElement?.offsetWidth || 1;
        const height = canvas.parentElement?.offsetHeight || 1;

        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(width, height);

        this.camera = new PerspectiveCamera(45, width / height, 0.1, 1000);
        this.camera.position.set(0, 0, 1.8);

        this.experimentBackground = new ExperimentBackground();
        this.scene.add(this.experimentBackground);

        this.boundResize = () => this.onWindowResize();
        window.addEventListener('resize', this.boundResize);

        void this.bootstrap(options?.onReady);
    }

    private async bootstrap(onReady?: () => void) {
        const loader = new TextureLoader();

        loader.setCrossOrigin('anonymous');

        try {
            const [tex1, tex2] = await Promise.all([loader.loadAsync(TEXTURE_URL_1), loader.loadAsync(TEXTURE_URL_2)]);

            for (const t of [tex1, tex2]) {
                t.colorSpace = SRGBColorSpace;
            }

            this.textures = [tex1, tex2];

            const planeSize = new Vector2(1, 1);
            const size0 = new Vector2(tex1.image.naturalWidth, tex1.image.naturalHeight);
            const size1 = new Vector2(tex2.image.naturalWidth, tex2.image.naturalHeight);

            this.material = new ShaderMaterial({
                uniforms: {
                    uCurrentImage: { value: tex1 },
                    uCurrentImageSize: { value: size0 },
                    uNextImage: { value: tex2 },
                    uNextImageSize: { value: size1 },
                    uPlaneSize: { value: planeSize },
                    uTime: { value: 0 },
                    uProgress: { value: this.params.progress },
                    uWaveSpeed: { value: this.params.waveSpeed },
                    uRippleStrength: { value: this.params.rippleStrength },
                    uFadeOffset: { value: this.params.fadeOffset },
                    uInnerRippleSpeed: { value: this.params.innerRippleSpeed },
                },
                vertexShader: VERTEX_SHADER,
                fragmentShader: FRAGMENT_SHADER,
            });

            const geometry = new PlaneGeometry(planeSize.x, planeSize.y);

            this.mesh = new Mesh(geometry, this.material);
            this.scene.add(this.mesh);

            this.applyParamsToUniforms();
            this.initTweakPane();
            this.renderer.setAnimationLoop(() => this.renderFrame());
            onReady?.();
        } catch {
            this.scene.background = new Color(0x222222);
            this.renderer.setAnimationLoop(() => this.renderFrame());
            onReady?.();
        }
    }

    private renderFrame() {
        const elapsed = this.clock.getElapsedTime();

        if (this.material) {
            this.material.uniforms.uTime.value = elapsed;
        }

        this.experimentBackground.update(elapsed);
        this.renderer.render(this.scene, this.camera);
    }

    private applyParamsToUniforms() {
        if (!this.material) return;

        const u = this.material.uniforms;

        u.uProgress.value = this.params.progress;
        u.uWaveSpeed.value = this.params.waveSpeed;
        u.uRippleStrength.value = this.params.rippleStrength;
        u.uFadeOffset.value = this.params.fadeOffset;
        u.uInnerRippleSpeed.value = this.params.innerRippleSpeed;
    }

    private initTweakPane() {
        this.tweakPane = new Pane({ title: 'Image transition', expanded: matchMedia('(min-width: 1200px)').matches });
        const onChange = () => this.applyParamsToUniforms();

        this.tweakPane.addBinding(this.params, 'progress', { min: 0, max: 1, step: 0.001 }).on('change', onChange);
        this.tweakPane.addBinding(this.params, 'waveSpeed', { min: 0, max: 20, step: 0.001 }).on('change', onChange);
        this.tweakPane
            .addBinding(this.params, 'rippleStrength', { min: 0, max: 3, step: 0.001 })
            .on('change', onChange);
        this.tweakPane.addBinding(this.params, 'fadeOffset', { min: 0, max: 0.5, step: 0.001 }).on('change', onChange);
        this.tweakPane
            .addBinding(this.params, 'innerRippleSpeed', { min: 0, max: 20, step: 0.001 })
            .on('change', onChange);
    }

    updateParams(p: Partial<ImageTransitionParams>) {
        if (p.progress !== undefined) this.params.progress = p.progress;

        if (p.waveSpeed !== undefined) this.params.waveSpeed = p.waveSpeed;

        if (p.rippleStrength !== undefined) this.params.rippleStrength = p.rippleStrength;

        if (p.fadeOffset !== undefined) this.params.fadeOffset = p.fadeOffset;

        if (p.innerRippleSpeed !== undefined) this.params.innerRippleSpeed = p.innerRippleSpeed;

        this.applyParamsToUniforms();
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
        this.tweakPane?.dispose();
        this.tweakPane = undefined;
        window.removeEventListener('resize', this.boundResize);
        this.renderer.setAnimationLoop(null);

        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh.geometry.dispose();
            this.mesh = null;
        }

        if (this.material) {
            this.material.dispose();
            this.material = null;
        }

        for (const t of this.textures) {
            t.dispose();
        }

        this.textures = [];
        this.scene.remove(this.experimentBackground);
        this.experimentBackground.dispose();
        this.renderer.dispose();
    }
}

export default ImageTransitionDemo;
