import {
    AdditiveBlending,
    BufferAttribute,
    BufferGeometry,
    Clock,
    Color,
    FloatType,
    Mesh,
    NearestFilter,
    OrthographicCamera,
    PerspectiveCamera,
    Points,
    RGBAFormat,
    SRGBColorSpace,
    Scene,
    ShaderMaterial,
    WebGLRenderTarget,
    WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { SimulationMaterial } from './SimulationMaterial';
import PARTICLE_FRAGMENT_SHADER from './shaders/fragment.glsl?raw';
import PARTICLE_VERTEX_SHADER from './shaders/vertex.glsl?raw';

export type FboParticlesParams = {
    count: number;
    frequency: number;
    speed: number;
    color: string;
};

const defaultParams = (): FboParticlesParams => ({
    count: 500,
    frequency: 0.2,
    speed: 0.07,
    color: '#1c2631',
});

function clampSimSize(count: number) {
    return Math.max(2, Math.min(1000, Math.round(count)));
}

class FboParticlesDemo {
    private readonly canvas: HTMLCanvasElement;
    private readonly renderer: WebGLRenderer;
    private readonly scene: Scene;
    private readonly camera: PerspectiveCamera;
    private readonly controls: OrbitControls;
    private readonly clock = new Clock();

    private readonly offscreenScene: Scene;
    private readonly fboCamera: OrthographicCamera;
    private readonly simulationMaterial: SimulationMaterial;
    private readonly simulationMesh: Mesh<BufferGeometry, SimulationMaterial>;
    private readonly renderTarget: WebGLRenderTarget;

    private readonly points: Points<BufferGeometry, ShaderMaterial>;
    private readonly pointsMaterial: ShaderMaterial;

    private readonly boundResize: () => void;
    private readonly simSize: number;

    constructor(canvas: HTMLCanvasElement, initialParams?: Partial<FboParticlesParams>) {
        this.canvas = canvas;
        const params = { ...defaultParams(), ...initialParams };

        this.simSize = clampSimSize(params.count);

        this.renderer = new WebGLRenderer({
            canvas,
            alpha: false,
            antialias: false,
            powerPreference: 'high-performance',
        });
        this.renderer.outputColorSpace = SRGBColorSpace;

        const width = canvas.parentElement?.offsetWidth || 1;
        const height = canvas.parentElement?.offsetHeight || 1;

        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(width, height);

        this.scene = new Scene();

        this.camera = new PerspectiveCamera(45, width / height, 0.1, 1000);
        this.camera.position.set(0, 0, 3);

        this.controls = new OrbitControls(this.camera, canvas);
        this.controls.enableDamping = true;

        this.offscreenScene = new Scene();
        this.fboCamera = new OrthographicCamera(-1, 1, 1, -1, 1 / Math.pow(2, 53), 1);

        this.simulationMaterial = new SimulationMaterial(this.simSize, params.frequency, params.speed);
        const simGeometry = new BufferGeometry();
        const quadPos = new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0]);
        const quadUv = new Float32Array([0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0]);

        simGeometry.setAttribute('position', new BufferAttribute(quadPos, 3));
        simGeometry.setAttribute('uv', new BufferAttribute(quadUv, 2));
        this.simulationMesh = new Mesh(simGeometry, this.simulationMaterial);
        this.offscreenScene.add(this.simulationMesh);

        this.renderTarget = new WebGLRenderTarget(this.simSize, this.simSize, {
            minFilter: NearestFilter,
            magFilter: NearestFilter,
            format: RGBAFormat,
            type: FloatType,
            depthBuffer: false,
            stencilBuffer: false,
        });

        const particleCount = this.simSize * this.simSize;
        const particlesPosition = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;

            particlesPosition[i3 + 0] = (i % this.simSize) / this.simSize;
            particlesPosition[i3 + 1] = i / this.simSize / this.simSize;
            particlesPosition[i3 + 2] = 0;
        }

        const particleGeometry = new BufferGeometry();

        particleGeometry.setAttribute('position', new BufferAttribute(particlesPosition, 3));

        this.pointsMaterial = new ShaderMaterial({
            uniforms: {
                uPositions: { value: this.renderTarget.texture },
                uTime: { value: 0 },
                uColor: { value: new Color(params.color) },
            },
            vertexShader: PARTICLE_VERTEX_SHADER,
            fragmentShader: PARTICLE_FRAGMENT_SHADER,
            depthWrite: false,
            blending: AdditiveBlending,
        });

        this.points = new Points(particleGeometry, this.pointsMaterial);
        this.scene.add(this.points);

        this.boundResize = () => this.onWindowResize();
        window.addEventListener('resize', this.boundResize);

        this.renderer.setAnimationLoop(() => this.renderFrame());
    }

    private renderFrame() {
        const time = this.clock.getElapsedTime();

        this.controls.update();

        this.simulationMaterial.uniforms.uTime.value = time;
        this.renderer.setRenderTarget(this.renderTarget);
        this.renderer.clear();
        this.renderer.render(this.offscreenScene, this.fboCamera);
        this.renderer.setRenderTarget(null);

        this.pointsMaterial.uniforms.uPositions.value = this.renderTarget.texture;
        this.pointsMaterial.uniforms.uTime.value = time;

        this.renderer.render(this.scene, this.camera);
    }

    updateParams(p: Partial<Pick<FboParticlesParams, 'frequency' | 'speed' | 'color'>>) {
        if (p.frequency !== undefined) this.simulationMaterial.uniforms.uFrequency.value = p.frequency;

        if (p.speed !== undefined) this.simulationMaterial.uniforms.uSpeed.value = p.speed;

        if (p.color !== undefined) this.pointsMaterial.uniforms.uColor.value.set(p.color);
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

        this.offscreenScene.remove(this.simulationMesh);
        this.simulationMesh.geometry.dispose();
        this.simulationMaterial.dispose();

        this.renderTarget.dispose();

        this.scene.remove(this.points);
        this.points.geometry.dispose();
        this.pointsMaterial.dispose();

        this.renderer.dispose();
    }
}

export default FboParticlesDemo;
