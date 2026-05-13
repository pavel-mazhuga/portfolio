import {
    AdditiveBlending,
    BufferAttribute,
    BufferGeometry,
    Clock,
    Color,
    MathUtils,
    PerspectiveCamera,
    Points,
    Scene,
    ShaderMaterial,
    WebGLRenderer,
} from 'three';

const VERTEX_SHADER = /* glsl */ `
uniform float uTime;
uniform float uPointSize;
uniform float uRadius;
uniform float uPower;
uniform float uSpeed;

varying float vDistance;

mat3 rotation3dY(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat3(
        c, 0.0, -s,
        0.0, 1.0, 0.0,
        s, 0.0, c
    );
}

void main() {
    float distanceFactor = pow(uRadius - distance(position, vec3(0.)), uPower);
    vDistance = distanceFactor;
    float size = 1.2 + distanceFactor * 0.5;
    vec3 particlePosition = position * rotation3dY(uTime * uSpeed * distanceFactor);

    vec4 modelPosition = modelMatrix * vec4(particlePosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;

    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = (1.0 / -viewPosition.z) * size * uPointSize;
}
`;

const FRAGMENT_SHADER = /* glsl */ `
uniform float uTime;

varying float vDistance;

void main() {
    vec3 color = vec3(0.12, 0.72, 0.87);
    float strength = distance(gl_PointCoord, vec2(0.5));
    strength = 1.0 - strength;
    strength = pow(strength, 3.);
    color = mix(color, vec3(0.97, 0.7, 0.45), vDistance * 0.5);
    color = mix(vec3(0.), color, strength);

    gl_FragColor = vec4(color, 1.);
    #include <colorspace_fragment>
}
`;

export type GpuParticlesParams = {
    count: number;
    radius: number;
    power: number;
    pointSize: number;
    speed: number;
};

const defaultParams = (): GpuParticlesParams => ({
    count: 30000,
    radius: 2.5,
    power: 3,
    pointSize: 3,
    speed: 0.3,
});

function buildParticlePositions(count: number, radius: number): Float32Array {
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
        const d = Math.sqrt(Math.random()) * radius;
        const theta = MathUtils.randFloatSpread(360);
        const phi = MathUtils.randFloatSpread(360);

        const x = d * Math.sin(theta) * Math.cos(phi);
        const y = d * Math.sin(theta) * Math.sin(phi);
        const z = d * Math.cos(theta);

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
    }

    return positions;
}

class GpuParticlesDemo {
    private readonly canvas: HTMLCanvasElement;
    private readonly renderer: WebGLRenderer;
    private readonly scene: Scene;
    private readonly camera: PerspectiveCamera;
    private readonly clock = new Clock();
    private readonly material: ShaderMaterial;
    private readonly points: Points<BufferGeometry, ShaderMaterial>;
    private readonly boundResize: () => void;
    private particleCount: number;
    private particleRadius: number;

    constructor(canvas: HTMLCanvasElement, initialParams?: Partial<GpuParticlesParams>) {
        this.canvas = canvas;
        const params = { ...defaultParams(), ...initialParams };

        this.particleCount = params.count;
        this.particleRadius = params.radius;

        this.renderer = new WebGLRenderer({
            canvas,
            alpha: false,
            antialias: false,
            powerPreference: 'high-performance',
        });

        const width = canvas.parentElement?.offsetWidth || 1;
        const height = canvas.parentElement?.offsetHeight || 1;

        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(width, height);

        this.scene = new Scene();
        this.scene.background = new Color(0x000000);

        this.camera = new PerspectiveCamera(45, width / height, 0.1, 1000);
        this.camera.position.set(0, 0, 3);

        const geometry = new BufferGeometry();

        geometry.setAttribute('position', new BufferAttribute(buildParticlePositions(params.count, params.radius), 3));

        this.material = new ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uPointSize: { value: params.pointSize },
                uRadius: { value: params.radius },
                uPower: { value: params.power },
                uSpeed: { value: params.speed },
            },
            vertexShader: VERTEX_SHADER,
            fragmentShader: FRAGMENT_SHADER,
            depthWrite: false,
            blending: AdditiveBlending,
        });

        this.points = new Points(geometry, this.material);
        this.scene.add(this.points);

        this.boundResize = () => this.onWindowResize();
        window.addEventListener('resize', this.boundResize);

        this.renderer.setAnimationLoop(() => this.renderFrame());
    }

    private renderFrame() {
        this.material.uniforms.uTime.value = this.clock.getElapsedTime();
        this.renderer.render(this.scene, this.camera);
    }

    updateParams(p: Partial<GpuParticlesParams>) {
        const u = this.material.uniforms;

        let nextCount = this.particleCount;
        let nextRadius = this.particleRadius;

        if (p.count !== undefined) nextCount = p.count;

        if (p.radius !== undefined) nextRadius = p.radius;

        const rebuild = p.count !== undefined || p.radius !== undefined;

        if (p.pointSize !== undefined) u.uPointSize.value = p.pointSize;

        if (p.power !== undefined) u.uPower.value = p.power;

        if (p.speed !== undefined) u.uSpeed.value = p.speed;

        if (p.radius !== undefined) u.uRadius.value = p.radius;

        if (rebuild) {
            const positions = buildParticlePositions(nextCount, nextRadius);

            this.points.geometry.setAttribute('position', new BufferAttribute(positions, 3));
            this.particleCount = nextCount;
            this.particleRadius = nextRadius;
        }
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
        this.scene.remove(this.points);
        this.points.geometry.dispose();
        this.material.dispose();
        this.renderer.dispose();
    }
}

export default GpuParticlesDemo;
