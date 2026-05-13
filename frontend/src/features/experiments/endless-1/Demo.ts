import {
    ACESFilmicToneMapping,
    Clock,
    Mesh,
    OrthographicCamera,
    PlaneGeometry,
    SRGBColorSpace,
    Scene,
    ShaderMaterial,
    Vector2,
    WebGLRenderer,
} from 'three';

const VERTEX_SHADER = /* glsl */ `
void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const FRAGMENT_SHADER = /* glsl */ `
uniform float uTime;
uniform vec2 uResolution;

vec3 paletteFn(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b * cos(6.28318 * (c * t + d));
}

vec3 experimentPalette(float t) {
    vec3 a = vec3(0.5);
    vec3 b = vec3(0.5);
    vec3 c = vec3(1.0);
    vec3 d = vec3(0.263, 0.416, 0.557);

    return paletteFn(t, a, b, c, d);
}

void main() {
    vec2 uv = gl_FragCoord.xy / uResolution - 1.0;
    uv.x *= uResolution.x / uResolution.y;
    vec2 uv0 = uv;

    uv = fract(uv * 2.0) - 0.5;

    vec3 col = experimentPalette(length(uv0 * 0.9) + uTime * 0.4);

    float d = length(uv);
    d = sin(d * 8.0 + uTime) / 8.0;
    d = abs(d);
    d = 0.02 / d;
    col *= d;

    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
}
`;

class Demo {
    private readonly canvas: HTMLCanvasElement;
    private readonly renderer: WebGLRenderer;
    private readonly scene: Scene;
    private readonly camera: OrthographicCamera;
    private readonly material: ShaderMaterial;
    private readonly mesh: Mesh<PlaneGeometry, ShaderMaterial>;
    private readonly clock = new Clock();
    private readonly boundResize: () => void;

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

        this.camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
        this.camera.position.z = 1;

        this.material = new ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uResolution: { value: new Vector2() },
            },
            vertexShader: VERTEX_SHADER,
            fragmentShader: FRAGMENT_SHADER,
        });

        const geometry = new PlaneGeometry(2, 2);

        this.mesh = new Mesh(geometry, this.material);
        this.scene.add(this.mesh);

        this.boundResize = () => this.onWindowResize();
        window.addEventListener('resize', this.boundResize);

        this.syncResolutionUniform();

        this.renderer.setAnimationLoop(() => this.renderFrame());
    }

    private syncResolutionUniform() {
        const uRes = this.material.uniforms.uResolution.value as Vector2;

        uRes.set(this.renderer.domElement.width, this.renderer.domElement.height);
    }

    private renderFrame() {
        this.material.uniforms.uTime.value = this.clock.getElapsedTime();
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        const width = this.canvas.parentElement?.offsetWidth || 1;
        const height = this.canvas.parentElement?.offsetHeight || 1;

        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(width, height);
        this.syncResolutionUniform();
    }

    destroy() {
        window.removeEventListener('resize', this.boundResize);
        this.renderer.setAnimationLoop(null);
        this.scene.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.material.dispose();
        this.renderer.dispose();
    }
}

export default Demo;
