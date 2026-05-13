import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
    Color,
    FrontSide,
    Mesh,
    MeshBasicMaterial,
    NoToneMapping,
    PerspectiveCamera,
    PlaneGeometry,
    Scene,
    ShaderMaterial,
    SRGBColorSpace,
    TextureLoader,
    TorusGeometry,
    Vector2,
    Vector3,
    WebGLRenderer,
    WebGLRenderTarget,
} from 'three';

export const BACKGROUND_TEXTURE_URL =
    'https://images.unsplash.com/photo-1691380303276-341a5ac56744?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=987&q=80';

const VERTEX_SHADER = /* glsl */ `
varying vec3 vNormal;
varying vec3 vEyeVector;

void main() {
    vNormal = normalize(modelMatrix * vec4(normal, 0.)).xyz;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vEyeVector = normalize(worldPos.xyz - cameraPosition);
    vec4 mvPosition = viewMatrix * worldPos;

    gl_Position = projectionMatrix * mvPosition;
}
`;

const FRAGMENT_SHADER = /* glsl */ `
varying vec3 vNormal;
varying vec3 vEyeVector;

uniform vec2 winResolution;
uniform sampler2D uTexture;
uniform float uIorR;
uniform float uIorY;
uniform float uIorG;
uniform float uIorC;
uniform float uIorB;
uniform float uIorV;
uniform float uChromaticAberration;
uniform float uRefractPower;
uniform float uSaturation;
uniform float uShininess;
uniform float uDiffuseness;
uniform vec3 uLight;
uniform float uFresnelPower;

vec3 sat(vec3 rgb, float intensity) {
    vec3 luminance = vec3(0.2125, 0.7154, 0.721);
    vec3 grayscale = vec3(dot(rgb, luminance));

    return mix(grayscale, rgb, intensity);
}

float specular(vec3 light, float shininess, float diffuseness) {
    vec3 normal = vNormal;
    vec3 eyeVector = vEyeVector;
    vec3 lightVector = normalize(-light);
    vec3 halfVector = normalize(eyeVector + lightVector);

    float NdotL = dot(normal, lightVector);
    float NdotH = dot(normal, halfVector);
    float NdotH2 = NdotH * NdotH;

    float kDiffuse = max(0.0, NdotL);
    float kSpecular = pow(NdotH2, shininess);

    return kSpecular + kDiffuse * diffuseness;
}

float fresnel(vec3 eyeVector, vec3 worldNormal, float power) {
    float fresnelFactor = abs(dot(eyeVector, worldNormal));
    float inversefresnelFactor = 1.0 - fresnelFactor;

    return pow(inversefresnelFactor, power);
}

const int LOOP = 8;

void main() {
    vec2 uv = gl_FragCoord.xy / winResolution.xy;
    vec3 normal = vNormal;
    vec3 eyeVector = vEyeVector;

    vec3 color = vec3(0.);

    for ( int i = 0; i < LOOP; i ++ ) {
        float slide = float(i) / float(LOOP) * 0.1;

        vec3 refractVecR = refract(eyeVector, normal, 1. / uIorR);
        vec3 refractVecY = refract(eyeVector, normal, 1. / uIorY);
        vec3 refractVecG = refract(eyeVector, normal, 1. / uIorG);
        vec3 refractVecC = refract(eyeVector, normal, 1. / uIorC);
        vec3 refractVecB = refract(eyeVector, normal, 1. / uIorB);
        vec3 refractVecV = refract(eyeVector, normal, 1. / uIorV);

        float r = texture2D(uTexture, uv + refractVecR.xy * (uRefractPower + slide * 1.) * uChromaticAberration).x * 0.5;

        float y = (texture2D(uTexture, uv + refractVecY.xy * (uRefractPower + slide * 1.) * uChromaticAberration).x * 2. +
                texture2D(uTexture, uv + refractVecY.xy * (uRefractPower + slide * 1.) * uChromaticAberration).y * 2. -
                texture2D(uTexture, uv + refractVecY.xy * (uRefractPower + slide * 1.) * uChromaticAberration).z) / 6.;

        float g = texture2D(uTexture, uv + refractVecG.xy * (uRefractPower + slide * 2.) * uChromaticAberration).y * 0.5;

        float c = (texture2D(uTexture, uv + refractVecC.xy * (uRefractPower + slide * 2.5) * uChromaticAberration).y * 2. +
                texture2D(uTexture, uv + refractVecC.xy * (uRefractPower + slide * 2.5) * uChromaticAberration).z * 2. -
                texture2D(uTexture, uv + refractVecC.xy * (uRefractPower + slide * 2.5) * uChromaticAberration).x) / 6.;

        float b = texture2D(uTexture, uv + refractVecB.xy * (uRefractPower + slide * 3.) * uChromaticAberration).z * 0.5;

        float v = (texture2D(uTexture, uv + refractVecV.xy * (uRefractPower + slide * 1.) * uChromaticAberration).z * 2. +
                    texture2D(uTexture, uv + refractVecV.xy * (uRefractPower + slide * 1.) * uChromaticAberration).x * 2. -
                    texture2D(uTexture, uv + refractVecV.xy * (uRefractPower + slide * 1.) * uChromaticAberration).y) / 6.;

        float R = r + (2. * v + 2. * y - c) / 3.;
        float G = g + (2. * y + 2. * c - v) / 3.;
        float B = b + (2. * c + 2. * v - y) / 3.;

        color.r += R;
        color.g += G;
        color.b += B;

        color = sat(color, uSaturation);
    }

    color /= float(LOOP);

    float specularLight = specular(uLight, uShininess, uDiffuseness);
    color += specularLight;

    float f = fresnel(eyeVector, normal, uFresnelPower);
    color.rgb += f * vec3(0.85);

    gl_FragColor = vec4(color, 1.);
}
`;

type DemoOptions = {
    onReady?: () => void;
};

class Demo {
    private readonly canvas: HTMLCanvasElement;
    private readonly renderer: WebGLRenderer;
    private readonly scene: Scene;
    private readonly camera: PerspectiveCamera;
    private readonly controls: OrbitControls;
    private readonly boundResize: () => void;
    private readonly renderTarget: WebGLRenderTarget;
    private readonly dispersionMaterial: ShaderMaterial;
    private readonly torusMesh: Mesh<TorusGeometry, ShaderMaterial>;
    private backgroundMesh: Mesh<PlaneGeometry, MeshBasicMaterial> | null = null;

    constructor(canvas: HTMLCanvasElement, isMobile: boolean, options?: DemoOptions) {
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
        const dpr = Math.min(window.devicePixelRatio, 2);

        this.renderer.setPixelRatio(dpr);
        this.renderer.setSize(width, height);

        this.renderTarget = new WebGLRenderTarget(1, 1, {
            depthBuffer: true,
            stencilBuffer: false,
        });

        this.camera = new PerspectiveCamera(45, width / height, 0.1, 1000);
        this.camera.position.set(0, 0, 5);

        this.controls = new OrbitControls(this.camera, canvas);
        this.controls.enableDamping = true;

        const radial = isMobile ? 128 : 256;
        const tubular = isMobile ? 48 : 80;
        const torusGeometry = new TorusGeometry(1.2, 0.5, radial, tubular);

        this.dispersionMaterial = new ShaderMaterial({
            uniforms: {
                uTexture: { value: null },
                winResolution: {
                    value: new Vector2(this.renderTarget.width, this.renderTarget.height),
                },
                uIorR: { value: 1.15 },
                uIorY: { value: 1.16 },
                uIorG: { value: 1.18 },
                uIorC: { value: 1.22 },
                uIorB: { value: 1.22 },
                uIorV: { value: 1.22 },
                uChromaticAberration: { value: 0.2 },
                uRefractPower: { value: 0.4 },
                uSaturation: { value: 1.02 },
                uLight: { value: new Vector3(-1, 1, 1) },
                uShininess: { value: 20 },
                uDiffuseness: { value: 0.3 },
                uFresnelPower: { value: 8 },
            },
            vertexShader: VERTEX_SHADER,
            fragmentShader: FRAGMENT_SHADER,
            toneMapped: false,
        });

        this.torusMesh = new Mesh(torusGeometry, this.dispersionMaterial);
        this.scene.add(this.torusMesh);

        this.syncRenderTargetSize(width, height, dpr);

        this.boundResize = () => this.onWindowResize();
        window.addEventListener('resize', this.boundResize);

        this.renderer.setAnimationLoop(() => this.renderFrame());
        void this.bootstrap(options?.onReady);
    }

    private syncRenderTargetSize(width: number, height: number, dpr: number) {
        const w = Math.max(1, Math.floor(width * dpr));
        const h = Math.max(1, Math.floor(height * dpr));

        this.renderTarget.setSize(w, h);
        this.dispersionMaterial.uniforms.winResolution.value.set(w, h);
    }

    private async bootstrap(onReady?: () => void) {
        const loader = new TextureLoader();

        loader.setCrossOrigin('anonymous');

        try {
            const texture = await loader.loadAsync(BACKGROUND_TEXTURE_URL);

            texture.colorSpace = SRGBColorSpace;

            const scale = 15;
            const bgGeometry = new PlaneGeometry(scale, scale);
            const bgMaterial = new MeshBasicMaterial({ map: texture });

            this.backgroundMesh = new Mesh(bgGeometry, bgMaterial);
            this.backgroundMesh.position.set(0, 0, -1);
            this.scene.add(this.backgroundMesh);
        } catch {
            // scene stays without background; torus still runs
        }

        onReady?.();
    }

    private renderFrame() {
        this.controls.update();

        this.torusMesh.visible = false;
        this.renderer.setRenderTarget(this.renderTarget);
        this.renderer.render(this.scene, this.camera);

        this.dispersionMaterial.uniforms.uTexture.value = this.renderTarget.texture;
        this.dispersionMaterial.side = FrontSide;
        this.torusMesh.visible = true;
        this.renderer.setRenderTarget(null);
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        const width = this.canvas.parentElement?.offsetWidth || 1;
        const height = this.canvas.parentElement?.offsetHeight || 1;
        const dpr = Math.min(window.devicePixelRatio, 2);

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setPixelRatio(dpr);
        this.renderer.setSize(width, height);
        this.syncRenderTargetSize(width, height, dpr);
    }

    destroy() {
        window.removeEventListener('resize', this.boundResize);
        this.renderer.setAnimationLoop(null);
        this.controls.dispose();

        this.scene.remove(this.torusMesh);
        this.torusMesh.geometry.dispose();
        this.dispersionMaterial.dispose();

        if (this.backgroundMesh) {
            this.scene.remove(this.backgroundMesh);
            this.backgroundMesh.geometry.dispose();
            const mat = this.backgroundMesh.material;

            mat.map?.dispose();
            mat.dispose();
            this.backgroundMesh = null;
        }

        this.renderTarget.dispose();
        this.renderer.dispose();
    }
}

export default Demo;
