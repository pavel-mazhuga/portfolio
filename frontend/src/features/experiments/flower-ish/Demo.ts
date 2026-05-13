import {
    Clock,
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

const VERTEX_SHADER = /* glsl */ `
#define PI 3.1415926535897932384626433832795

varying float vPattern;

float smoothMod(float axis, float amp, float rad) {
    float top = cos(PI * (axis / amp)) * sin(PI * (axis / amp));
    float bottom = pow(sin(PI * (axis / amp)), 2.0) + pow(rad, 2.0);
    float at = atan(top / bottom);
    return amp * (1.0 / 2.0) - (1.0 / PI) * at;
}

float fit(float unscaled, float originalMin, float originalMax, float minAllowed, float maxAllowed) {
    return (maxAllowed - minAllowed) * (unscaled - originalMin) / (originalMax - originalMin) + minAllowed;
}

void main() {
    float pattern = fit(smoothMod(uv.x * 10.0, 1.0, 1.0), 0.3, 0.7, 0.0, 1.0);
    vPattern = pattern;

    vec3 newPosition = position * vec3(pattern);
    vec4 worldPos = modelMatrix * vec4(newPosition, 1.0);
    vec4 mvPosition = viewMatrix * worldPos;

    gl_Position = projectionMatrix * mvPosition;
}
`;

const FRAGMENT_SHADER = /* glsl */ `
varying float vPattern;

void main() {
    vec3 color = vec3(vPattern) * vec3(253.0 / 255.0, 206.0 / 255.0, 223.0 / 255.0);
    gl_FragColor = vec4(color, 1.0);
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
    private readonly mesh: Mesh<TorusGeometry, ShaderMaterial>;
    private readonly boundResize: () => void;

    constructor(canvas: HTMLCanvasElement) {
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
        this.camera.position.set(0, 0, 5);

        this.controls = new OrbitControls(this.camera, canvas);
        this.controls.enableDamping = true;

        const geometry = new TorusGeometry(1, 0.55, 128, 256);

        this.material = new ShaderMaterial({
            uniforms: {},
            vertexShader: VERTEX_SHADER,
            fragmentShader: FRAGMENT_SHADER,
            toneMapped: false,
        });

        this.mesh = new Mesh(geometry, this.material);
        this.scene.add(this.mesh);

        this.boundResize = () => this.onWindowResize();
        window.addEventListener('resize', this.boundResize);

        this.renderer.setAnimationLoop(() => this.renderFrame());
    }

    private renderFrame() {
        const time = this.clock.getElapsedTime();

        this.controls.update();
        this.mesh.rotation.z = time * 0.2;
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
        this.renderer.dispose();
    }
}

export default Demo;
