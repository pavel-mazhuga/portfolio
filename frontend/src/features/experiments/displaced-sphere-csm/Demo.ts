import {
    ACESFilmicToneMapping,
    AmbientLight,
    Clock,
    Color,
    DirectionalLight,
    IcosahedronGeometry,
    Mesh,
    MeshDepthMaterial,
    MeshPhysicalMaterial,
    PerspectiveCamera,
    RGBADepthPacking,
    SRGBColorSpace,
    Scene,
    WebGLRenderer,
} from 'three';
import CustomShaderMaterial from 'three-custom-shader-material/vanilla';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { Pane } from 'tweakpane';

const CNOISE_VEC3_BLOCK = /* glsl */ `
#ifndef PI
#define PI 3.1415926535897932384626433832795
#endif

float mod289(const in float x) { return x - floor(x * (1. / 289.)) * 289.; }
vec3 mod289(const in vec3 x) { return x - floor(x * (1. / 289.)) * 289.; }
vec4 mod289(const in vec4 x) { return x - floor(x * (1. / 289.)) * 289.; }

float permute(const in float v) { return mod289(((v * 34.0) + 1.0) * v); }
vec4 permute(const in vec4 v) { return mod289(((v * 34.0) + 1.0) * v); }

float taylorInvSqrt(in float r) { return 1.79284291400159 - 0.85373472095314 * r; }
vec4 taylorInvSqrt(in vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float quintic(const in float v) { return v*v*v*(v*(v*6.0-15.0)+10.0); }
vec3  quintic(const in vec3 v)  { return v*v*v*(v*(v*6.0-15.0)+10.0); }

float cnoise(in vec3 P) {
    vec3 Pi0 = floor(P);
    vec3 Pi1 = Pi0 + vec3(1.0);
    Pi0 = mod289(Pi0);
    Pi1 = mod289(Pi1);
    vec3 Pf0 = fract(P);
    vec3 Pf1 = Pf0 - vec3(1.0);
    vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
    vec4 iy = vec4(Pi0.yy, Pi1.yy);
    vec4 iz0 = Pi0.zzzz;
    vec4 iz1 = Pi1.zzzz;

    vec4 ixy = permute(permute(ix) + iy);
    vec4 ixy0 = permute(ixy + iz0);
    vec4 ixy1 = permute(ixy + iz1);

    vec4 gx0 = ixy0 * (1.0 / 7.0);
    vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
    gx0 = fract(gx0);
    vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
    vec4 sz0 = step(gz0, vec4(0.0));
    gx0 -= sz0 * (step(0.0, gx0) - 0.5);
    gy0 -= sz0 * (step(0.0, gy0) - 0.5);

    vec4 gx1 = ixy1 * (1.0 / 7.0);
    vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
    gx1 = fract(gx1);
    vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
    vec4 sz1 = step(gz1, vec4(0.0));
    gx1 -= sz1 * (step(0.0, gx1) - 0.5);
    gy1 -= sz1 * (step(0.0, gy1) - 0.5);

    vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
    vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
    vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
    vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
    vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
    vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
    vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
    vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

    vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
    g000 *= norm0.x;
    g010 *= norm0.y;
    g100 *= norm0.z;
    g110 *= norm0.w;
    vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
    g001 *= norm1.x;
    g011 *= norm1.y;
    g101 *= norm1.z;
    g111 *= norm1.w;

    float n000 = dot(g000, Pf0);
    float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
    float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
    float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
    float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
    float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
    float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
    float n111 = dot(g111, Pf1);

    vec3 fade_xyz = quintic(Pf0);
    vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
    vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
    float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
    return 2.2 * n_xyz;
}

float smoothMod(float axis, float amp, float rad) {
    float top = cos(PI * (axis / amp)) * sin(PI * (axis / amp));
    float bottom = pow(sin(PI * (axis / amp)), 2.0) + pow(rad, 2.0);
    float at = atan(top / bottom);
    return amp * (1.0 / 2.0) - (1.0 / PI) * at;
}
`;

const VERTEX_SHADER = /* glsl */ `
attribute vec4 tangent;

varying float vPattern;

uniform float uTime;
uniform float uSpeed;
uniform float uNoiseStrength;
uniform float uDisplacementStrength;
uniform float uFractAmount;

${CNOISE_VEC3_BLOCK}

float getDisplacement(vec3 position) {
    vec3 pos = position;
    pos.y -= uTime * 0.05 * uSpeed;
    pos += cnoise(pos * 1.65) * uNoiseStrength;

    return smoothMod(pos.y * uFractAmount, 1., 1.5) * uDisplacementStrength;
}

void main() {
    vec3 biTangent = cross(csm_Normal, tangent.xyz);
    float shift = 0.01;
    vec3 posA = csm_Position + tangent.xyz * shift;
    vec3 posB = csm_Position + biTangent * shift;

    float pattern = getDisplacement(csm_Position);
    vPattern = pattern;

    csm_Position += csm_Normal * pattern;
    posA += csm_Normal * getDisplacement(posA);
    posB += csm_Normal * getDisplacement(posB);

    vec3 toA = normalize(posA - csm_Position);
    vec3 toB = normalize(posB - csm_Position);

    csm_Normal = normalize(cross(toA, toB));
}
`;

const FRAGMENT_SHADER = /* glsl */ `
varying float vPattern;

uniform float uGradientStrength;
uniform vec3 uColor;

void main() {
    vec3 color = pow(vPattern, uGradientStrength) * uColor;

    csm_DiffuseColor = vec4(color, 1.);
}
`;

type Uniforms = {
    uTime: { value: number };
    uColor: { value: Color };
    uGradientStrength: { value: number };
    uSpeed: { value: number };
    uNoiseStrength: { value: number };
    uDisplacementStrength: { value: number };
    uFractAmount: { value: number };
};

class DisplacedSphereCsmDemo {
    canvas: HTMLCanvasElement;
    renderer: WebGLRenderer;
    scene: Scene;
    camera: PerspectiveCamera;
    controls: OrbitControls;
    clock = new Clock();
    tweakPane?: Pane;

    mesh: Mesh;
    uniforms: Uniforms;

    params = {
        gradientStrength: 1,
        color: '#af00ff',
        speed: 1.1,
        noiseStrength: 0.45,
        displacementStrength: 0.57,
        fractAmount: 4,
        roughness: 0.56,
        metalness: 0.76,
        clearcoat: 0,
        reflectivity: 0.46,
        ior: 2.81,
        iridescence: 0.96,
        ambientColor: '#ffffff',
        ambientIntensity: 1,
        directionalColor: '#ffffff',
        directionalIntensity: 5,
        directionalX: -2,
        directionalY: 2,
        directionalZ: 3.5,
    };

    private ambientLight: AmbientLight;
    private directionalLight: DirectionalLight;

    private readonly onResize: () => void;

    get dpr() {
        return Math.min(window.devicePixelRatio, 2);
    }

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.onResize = this.onWindowResize.bind(this);

        this.renderer = new WebGLRenderer({
            canvas,
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance',
        });
        this.renderer.outputColorSpace = SRGBColorSpace;
        this.renderer.toneMapping = ACESFilmicToneMapping;
        this.renderer.setPixelRatio(this.dpr);
        this.renderer.setSize(canvas.parentElement?.offsetWidth || 1, canvas.parentElement?.offsetHeight || 1);

        this.scene = new Scene();
        this.scene.background = new Color(0x0a0a12);

        this.camera = new PerspectiveCamera(45, canvas.width / Math.max(canvas.height, 1), 0.1, 1000);
        const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 1199px)').matches;

        this.camera.position.set(0, 0, isMobile ? 9 : 5);

        this.controls = new OrbitControls(this.camera, canvas);
        this.controls.enableDamping = true;

        this.uniforms = {
            uTime: { value: 0 },
            uColor: { value: new Color(this.params.color) },
            uGradientStrength: { value: this.params.gradientStrength },
            uSpeed: { value: this.params.speed },
            uNoiseStrength: { value: this.params.noiseStrength },
            uDisplacementStrength: { value: this.params.displacementStrength },
            uFractAmount: { value: this.params.fractAmount },
        };

        const detail = isMobile ? 128 : 200;
        const baseGeo = new IcosahedronGeometry(1.3, detail);
        const geometry = mergeVertices(baseGeo);

        geometry.computeTangents();

        const mainMaterial = new CustomShaderMaterial({
            baseMaterial: MeshPhysicalMaterial,
            vertexShader: VERTEX_SHADER,
            fragmentShader: FRAGMENT_SHADER,
            uniforms: this.uniforms,
            roughness: this.params.roughness,
            metalness: this.params.metalness,
            reflectivity: this.params.reflectivity,
            clearcoat: this.params.clearcoat,
            ior: this.params.ior,
            iridescence: this.params.iridescence,
        });

        const depthMaterial = new CustomShaderMaterial({
            baseMaterial: MeshDepthMaterial,
            vertexShader: VERTEX_SHADER,
            uniforms: this.uniforms,
            depthPacking: RGBADepthPacking,
        });

        this.mesh = new Mesh(geometry, mainMaterial);
        this.mesh.matrixAutoUpdate = false;
        this.mesh.frustumCulled = false;
        this.mesh.customDepthMaterial = depthMaterial;
        this.scene.add(this.mesh);

        this.ambientLight = new AmbientLight(this.params.ambientColor, this.params.ambientIntensity);
        this.scene.add(this.ambientLight);

        this.directionalLight = new DirectionalLight(this.params.directionalColor, this.params.directionalIntensity);
        this.directionalLight.position.set(
            this.params.directionalX,
            this.params.directionalY,
            this.params.directionalZ,
        );
        this.scene.add(this.directionalLight);

        this.initTweakPane();
        window.addEventListener('resize', this.onResize);
        this.onResize();

        this.renderer.setAnimationLoop(() => {
            this.uniforms.uTime.value = this.clock.getElapsedTime();
            this.controls.update();
            this.renderer.render(this.scene, this.camera);
        });
    }

    onWindowResize() {
        const width = this.canvas.parentElement?.offsetWidth || 1;
        const height = this.canvas.parentElement?.offsetHeight || 1;

        this.renderer.setPixelRatio(this.dpr);
        this.renderer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    }

    destroy() {
        this.renderer.setAnimationLoop(null);
        window.removeEventListener('resize', this.onResize);

        this.controls.dispose();
        this.scene.remove(this.mesh);

        const mat = this.mesh.material;

        if (Array.isArray(mat)) {
            mat.forEach((m) => m.dispose());
        } else {
            mat.dispose();
        }

        const depthMat = this.mesh.customDepthMaterial;

        if (depthMat) depthMat.dispose();

        this.mesh.geometry.dispose();
        this.tweakPane?.dispose();
        this.renderer.dispose();
    }

    private initTweakPane() {
        this.tweakPane = new Pane({ title: 'Parameters', expanded: matchMedia('(min-width: 1200px)').matches });

        const { uniforms } = this;
        const { params } = this;

        const mat = this.mesh.material as MeshPhysicalMaterial;

        const main = this.tweakPane.addFolder({ title: 'Material' });

        main.addBinding(params, 'gradientStrength', { min: 1, max: 3, step: 0.001 }).on('change', () => {
            uniforms.uGradientStrength.value = params.gradientStrength;
        });
        main.addBinding(params, 'color').on('change', () => {
            uniforms.uColor.value.set(params.color);
        });
        main.addBinding(params, 'speed', { min: 0, max: 20, step: 0.001 }).on('change', () => {
            uniforms.uSpeed.value = params.speed;
        });
        main.addBinding(params, 'noiseStrength', { min: 0, max: 3, step: 0.001 }).on('change', () => {
            uniforms.uNoiseStrength.value = params.noiseStrength;
        });
        main.addBinding(params, 'displacementStrength', { min: 0, max: 1, step: 0.001 }).on('change', () => {
            uniforms.uDisplacementStrength.value = params.displacementStrength;
        });
        main.addBinding(params, 'fractAmount', { min: 0, max: 10, step: 1 }).on('change', () => {
            uniforms.uFractAmount.value = params.fractAmount;
        });
        main.addBinding(params, 'roughness', { min: 0, max: 1, step: 0.001 }).on('change', () => {
            mat.roughness = params.roughness;
        });
        main.addBinding(params, 'metalness', { min: 0, max: 1, step: 0.001 }).on('change', () => {
            mat.metalness = params.metalness;
        });
        main.addBinding(params, 'clearcoat', { min: 0, max: 1, step: 0.001 }).on('change', () => {
            mat.clearcoat = params.clearcoat;
        });
        main.addBinding(params, 'reflectivity', { min: 0, max: 1, step: 0.001 }).on('change', () => {
            mat.reflectivity = params.reflectivity;
        });
        main.addBinding(params, 'ior', { min: 0.001, max: 5, step: 0.001 }).on('change', () => {
            mat.ior = params.ior;
        });
        main.addBinding(params, 'iridescence', { min: 0, max: 1, step: 0.001 }).on('change', () => {
            mat.iridescence = params.iridescence;
        });

        const amb = this.tweakPane.addFolder({ title: 'Ambient light' });

        amb.addBinding(params, 'ambientColor').on('change', () => {
            this.ambientLight.color.set(params.ambientColor);
        });
        amb.addBinding(params, 'ambientIntensity', { min: 0, max: 1, step: 0.001 }).on('change', () => {
            this.ambientLight.intensity = params.ambientIntensity;
        });

        const dir = this.tweakPane.addFolder({ title: 'Directional light' });

        dir.addBinding(params, 'directionalColor').on('change', () => {
            this.directionalLight.color.set(params.directionalColor);
        });
        dir.addBinding(params, 'directionalIntensity', { min: 0, max: 5, step: 0.001 }).on('change', () => {
            this.directionalLight.intensity = params.directionalIntensity;
        });
        dir.addBinding(params, 'directionalX', { min: -10, max: 10, step: 0.001 }).on('change', () => {
            this.directionalLight.position.x = params.directionalX;
        });
        dir.addBinding(params, 'directionalY', { min: -10, max: 10, step: 0.001 }).on('change', () => {
            this.directionalLight.position.y = params.directionalY;
        });
        dir.addBinding(params, 'directionalZ', { min: -10, max: 10, step: 0.001 }).on('change', () => {
            this.directionalLight.position.z = params.directionalZ;
        });
    }
}

export default DisplacedSphereCsmDemo;
