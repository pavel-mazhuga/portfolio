import gsap from 'gsap';
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
    Scene,
    ShaderMaterial,
    WebGLRenderTarget,
    WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { easeInOutQuart } from '@/shared/lib/easings';
import { SimulationMaterial } from './SimulationMaterial';
import PARTICLE_FRAGMENT_SHADER from './shaders/fragment.glsl?raw';
import PARTICLE_VERTEX_SHADER from './shaders/vertex.glsl?raw';

export type FboParticlesMorphingParams = {
    size: number;
    speed: number;
    colorA: string;
    colorB: string;
};

const DEFAULT_GRID_SIZE = 128;

const clampSize = (n: number) => {
    const x = Math.floor(Number(n));

    if (!Number.isFinite(x) || x < 1) {
        return DEFAULT_GRID_SIZE;
    }

    return Math.min(500, x);
};

const defaultParams = (): FboParticlesMorphingParams => ({
    size: DEFAULT_GRID_SIZE,
    speed: 0.07,
    colorA: '#9a441f',
    colorB: '#802974',
});

class FboParticlesMorphingDemo {
    private readonly canvas: HTMLCanvasElement;
    private readonly renderer: WebGLRenderer;
    private readonly scene: Scene;
    private readonly camera: PerspectiveCamera;
    private readonly controls: OrbitControls;
    private readonly clock = new Clock();

    private readonly simScene: Scene;
    private readonly simCamera: OrthographicCamera;
    private readonly simMesh: Mesh<BufferGeometry, SimulationMaterial>;
    private readonly renderTarget: WebGLRenderTarget;

    private readonly points: Points<BufferGeometry, ShaderMaterial>;
    private readonly particlesMaterial: ShaderMaterial;

    private readonly boundResize: () => void;
    private readonly onCanvasClick: () => void;

    private morphProgress = 0;
    private morphDone = false;
    private morphTween?: gsap.core.Tween;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        const p = defaultParams();
        const size = clampSize(p.size);

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

        this.camera = new PerspectiveCamera(45, width / height, 0.1, 1000);
        this.camera.position.set(0, 0, 5);

        this.controls = new OrbitControls(this.camera, canvas);
        this.controls.enableDamping = true;

        this.simScene = new Scene();
        this.simCamera = new OrthographicCamera(-1, 1, 1, -1, 1 / Math.pow(2, 53), 1);

        const simMaterial = new SimulationMaterial(size, p.speed, this.morphProgress);
        const quadPositions = new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0]);
        const quadUvs = new Float32Array([0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0]);
        const simGeometry = new BufferGeometry();

        simGeometry.setAttribute('position', new BufferAttribute(quadPositions, 3));
        simGeometry.setAttribute('uv', new BufferAttribute(quadUvs, 2));

        this.simMesh = new Mesh(simGeometry, simMaterial);
        this.simScene.add(this.simMesh);

        this.renderTarget = new WebGLRenderTarget(size, size, {
            minFilter: NearestFilter,
            magFilter: NearestFilter,
            format: RGBAFormat,
            stencilBuffer: false,
            type: FloatType,
        });
        this.renderTarget.texture.needsUpdate = true;

        const particleCount = size * size;
        const particles = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;

            particles[i3 + 0] = (i % size) / size;
            particles[i3 + 1] = i / size / size;
        }

        const particlesGeometry = new BufferGeometry();

        particlesGeometry.setAttribute('position', new BufferAttribute(particles, 3));

        this.particlesMaterial = new ShaderMaterial({
            uniforms: {
                uPositions: { value: this.renderTarget.texture },
                uTime: { value: 0 },
                uProgress: { value: 0 },
                uColorA: { value: new Color(p.colorA) },
                uColorB: { value: new Color(p.colorB) },
            },
            vertexShader: PARTICLE_VERTEX_SHADER,
            fragmentShader: PARTICLE_FRAGMENT_SHADER,
            depthWrite: false,
            blending: AdditiveBlending,
        });

        this.points = new Points(particlesGeometry, this.particlesMaterial);
        this.points.rotation.set(0.2, -Math.PI * 0.42, 0);
        this.scene.add(this.points);

        this.boundResize = () => this.onWindowResize();
        window.addEventListener('resize', this.boundResize);

        this.onCanvasClick = () => this.toggleMorph();
        canvas.addEventListener('click', this.onCanvasClick);

        this.renderer.setAnimationLoop(() => this.renderFrame());
    }

    private toggleMorph() {
        const to = this.morphDone ? 0 : 1;

        this.morphTween?.kill();
        this.morphTween = gsap.to(this, {
            morphProgress: to,
            duration: 2,
            ease: easeInOutQuart,
        });

        this.morphDone = !this.morphDone;
    }

    private renderFrame() {
        const time = this.clock.getElapsedTime();
        const simMat = this.simMesh.material;

        simMat.uniforms.uTime.value = time;
        simMat.uniforms.uProgress.value = this.morphProgress;

        this.renderer.setRenderTarget(this.renderTarget);
        this.renderer.clear();
        this.renderer.render(this.simScene, this.simCamera);
        this.renderer.setRenderTarget(null);

        this.particlesMaterial.uniforms.uPositions.value = this.renderTarget.texture;
        this.particlesMaterial.uniforms.uTime.value = time;
        this.particlesMaterial.uniforms.uProgress.value = this.morphProgress;

        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    updateParams(p: Partial<FboParticlesMorphingParams>) {
        if (p.speed !== undefined) {
            this.simMesh.material.uniforms.uSpeed.value = p.speed;
        }

        if (p.colorA !== undefined) {
            (this.particlesMaterial.uniforms.uColorA.value as Color).set(p.colorA);
        }

        if (p.colorB !== undefined) {
            (this.particlesMaterial.uniforms.uColorB.value as Color).set(p.colorB);
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
        this.morphTween?.kill();
        window.removeEventListener('resize', this.boundResize);
        this.canvas.removeEventListener('click', this.onCanvasClick);
        this.renderer.setAnimationLoop(null);
        this.controls.dispose();

        const simMat = this.simMesh.material;
        const texA = simMat.uniforms.uPositionsA.value as { dispose: () => void };
        const texB = simMat.uniforms.uPositionsB.value as { dispose: () => void };

        texA.dispose();
        texB.dispose();
        this.simMesh.geometry.dispose();
        simMat.dispose();

        this.renderTarget.dispose();

        this.points.geometry.dispose();
        this.particlesMaterial.dispose();

        this.scene.remove(this.points);
        this.simScene.remove(this.simMesh);

        this.renderer.dispose();
    }
}

export default FboParticlesMorphingDemo;
