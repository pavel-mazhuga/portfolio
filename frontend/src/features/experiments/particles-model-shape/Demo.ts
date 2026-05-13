import {
    AdditiveBlending,
    BufferAttribute,
    BufferGeometry,
    Clock,
    Color,
    DataTexture,
    FloatType,
    Mesh,
    MeshBasicMaterial,
    NearestFilter,
    Object3D,
    OrthographicCamera,
    PerspectiveCamera,
    PlaneGeometry,
    Points,
    RGBAFormat,
    Raycaster,
    Scene,
    ShaderMaterial,
    Vector2,
    Vector3,
    WebGLRenderTarget,
    WebGLRenderer,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { lerp } from '@/shared/lib/math/lerp';
import {
    PARTICLE_FRAGMENT_SHADER,
    PARTICLE_VERTEX_SHADER,
    SIMULATION_FRAGMENT_SHADER,
    SIMULATION_VERTEX_SHADER,
} from './particlesModelShapeShaders';

export type ParticlesModelShapeParams = {
    speed: number;
    color: string;
    power: number;
    distribution: number;
    particleSize: number;
};

export type ParticlesModelShapeDemoOptions = ParticlesModelShapeParams & {
    count: number;
    supportsTouch: boolean;
};

const defaultOptions = (): ParticlesModelShapeDemoOptions => ({
    count: 256,
    supportsTouch: false,
    speed: 0.04,
    color: '#164e24',
    power: 5,
    distribution: 0.7,
    particleSize: 200,
});

function findPrimaryGeometry(root: Object3D): BufferGeometry {
    let object2: BufferGeometry | null = null;
    let fallback: BufferGeometry | null = null;

    root.traverse((child) => {
        if ('isMesh' in child && (child as Mesh).isMesh) {
            const mesh = child as Mesh;

            if (mesh.geometry) {
                fallback = mesh.geometry;

                if (mesh.name === 'Object_2') {
                    object2 = mesh.geometry;
                }
            }
        }
    });
    const g = object2 ?? fallback;

    if (!g) {
        throw new Error('particles-model-shape: no mesh geometry in GLTF');
    }

    return g;
}

function prepareSampleGeometry(source: BufferGeometry): BufferGeometry {
    const geometry = source.clone();

    geometry.computeBoundingBox();
    const box = geometry.boundingBox;

    if (!box) {
        return geometry;
    }

    const offset = box.getCenter(new Vector3());

    geometry.translate(-offset.x, -offset.y, -offset.z);
    geometry.rotateX(-Math.PI / 2);

    return geometry;
}

function buildRandomPositionsTexture(geometry: BufferGeometry, width: number, height: number): DataTexture {
    const posAttr = geometry.attributes.position;
    const arr = posAttr.array as Float32Array;
    const vertexCount = posAttr.count;
    const length = width * height * 4;
    const data = new Float32Array(length);

    for (let i = 0; i < width * height; i++) {
        const stride = i * 4;
        const rand = Math.floor(Math.random() * vertexCount);

        data[stride] = arr[3 * rand];
        data[stride + 1] = arr[3 * rand + 1];
        data[stride + 2] = arr[3 * rand + 2];
        data[stride + 3] = 1.0;
    }

    const tex = new DataTexture(data, width, height, RGBAFormat, FloatType);

    tex.needsUpdate = true;

    return tex;
}

class ParticlesModelShapeDemo {
    private readonly canvas: HTMLCanvasElement;
    private readonly renderer: WebGLRenderer;
    private readonly scene: Scene;
    private readonly camera: PerspectiveCamera;
    private readonly clock = new Clock();
    private readonly boundResize: () => void;
    private readonly boundTouchMove: (event: TouchEvent) => void;
    private readonly boundPointerMove: (event: PointerEvent) => void;

    private readonly fboScene: Scene;
    private readonly fboCamera: OrthographicCamera;
    private readonly raycaster = new Raycaster();
    private readonly pointerVec = new Vector2();
    private readonly dummyPlane = new Mesh(new PlaneGeometry(50, 50), new MeshBasicMaterial());

    private disposed = false;
    private ready = false;

    private count: number;
    private supportsTouch: boolean;

    private renderTarget!: WebGLRenderTarget;
    private simulationMaterial!: ShaderMaterial;
    private simulationMesh!: Mesh<BufferGeometry, ShaderMaterial>;
    private points!: Points<BufferGeometry, ShaderMaterial>;
    private pointsMaterial!: ShaderMaterial;
    private positionsTexture!: DataTexture;

    private pendingParams: Partial<ParticlesModelShapeParams> = {};

    constructor(canvas: HTMLCanvasElement, options?: Partial<ParticlesModelShapeDemoOptions>) {
        const opts = { ...defaultOptions(), ...options };

        this.canvas = canvas;
        this.count = opts.count;
        this.supportsTouch = opts.supportsTouch;

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
        this.camera.position.set(0, 0, 50);

        this.fboScene = new Scene();
        this.fboCamera = new OrthographicCamera(-1, 1, 1, -1, 1 / Math.pow(2, 53), 1);

        this.boundResize = () => this.onWindowResize();
        this.boundTouchMove = (event: TouchEvent) => this.onTouchMove(event);
        this.boundPointerMove = (event: PointerEvent) => this.onPointerMove(event);

        window.addEventListener('resize', this.boundResize);
        this.canvas.addEventListener('touchmove', this.boundTouchMove, { passive: true });
        this.canvas.addEventListener('pointermove', this.boundPointerMove);

        const loader = new GLTFLoader();

        loader.load(
            '/static/gltf/face2.glb',
            (gltf) => {
                if (this.disposed) {
                    return;
                }

                const geom = findPrimaryGeometry(gltf.scene);

                this.buildSimulationAndPoints(geom, opts);
            },
            undefined,
        );

        this.renderer.setAnimationLoop(() => this.renderFrame());
    }

    private buildSimulationAndPoints(modelGeometry: BufferGeometry, opts: ParticlesModelShapeDemoOptions) {
        const sampleGeometry = prepareSampleGeometry(modelGeometry);

        this.positionsTexture = buildRandomPositionsTexture(sampleGeometry, this.count, this.count);
        sampleGeometry.dispose();

        this.renderTarget = new WebGLRenderTarget(this.count, this.count, {
            minFilter: NearestFilter,
            magFilter: NearestFilter,
            format: RGBAFormat,
            stencilBuffer: false,
            type: FloatType,
        });

        this.simulationMaterial = new ShaderMaterial({
            uniforms: {
                uPositions: { value: this.positionsTexture },
                uTime: { value: 0 },
                uSpeed: { value: opts.speed },
                uPower: { value: opts.power },
                uDistribution: { value: opts.distribution },
                uMouse: { value: new Vector2(-20, 0) },
            },
            vertexShader: SIMULATION_VERTEX_SHADER,
            fragmentShader: SIMULATION_FRAGMENT_SHADER,
        });

        const simGeometry = new BufferGeometry();
        const positions = new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0]);
        const uvs = new Float32Array([0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0]);

        simGeometry.setAttribute('position', new BufferAttribute(positions, 3));
        simGeometry.setAttribute('uv', new BufferAttribute(uvs, 2));

        this.simulationMesh = new Mesh(simGeometry, this.simulationMaterial);
        this.fboScene.add(this.simulationMesh);

        const length = this.count * this.count;
        const particles = new Float32Array(length * 3);

        for (let i = 0; i < length; i++) {
            const i3 = i * 3;

            particles[i3 + 0] = (i % this.count) / this.count;
            particles[i3 + 1] = i / this.count / this.count;
        }

        const particlesGeometry = new BufferGeometry();

        particlesGeometry.setAttribute('position', new BufferAttribute(particles, 3));

        this.pointsMaterial = new ShaderMaterial({
            uniforms: {
                uPositions: { value: null },
                uTime: { value: 0 },
                uParticleSize: { value: opts.particleSize },
                uColor: { value: new Color(opts.color) },
            },
            vertexShader: PARTICLE_VERTEX_SHADER,
            fragmentShader: PARTICLE_FRAGMENT_SHADER,
            depthWrite: false,
            blending: AdditiveBlending,
        });

        this.points = new Points(particlesGeometry, this.pointsMaterial);
        this.scene.add(this.points);

        this.ready = true;
        this.applyParamsToUniforms({ ...opts, ...this.pendingParams });
        this.pendingParams = {};
    }

    private applyParamsToUniforms(p: Partial<ParticlesModelShapeParams>) {
        if (!this.ready) {
            return;
        }

        const su = this.simulationMaterial.uniforms;
        const pu = this.pointsMaterial.uniforms;

        if (p.speed !== undefined) {
            su.uSpeed.value = p.speed;
        }

        if (p.power !== undefined) {
            su.uPower.value = p.power;
        }

        if (p.distribution !== undefined) {
            su.uDistribution.value = p.distribution;
        }

        if (p.particleSize !== undefined) {
            pu.uParticleSize.value = p.particleSize;
        }

        if (p.color !== undefined) {
            pu.uColor.value.set(p.color);
        }
    }

    updateParams(p: Partial<ParticlesModelShapeParams>) {
        if (!this.ready) {
            this.pendingParams = { ...this.pendingParams, ...p };

            return;
        }

        this.applyParamsToUniforms(p);
    }

    private ndcFromClient(clientX: number, clientY: number) {
        const rect = this.canvas.getBoundingClientRect();
        const w = rect.width || 1;
        const h = rect.height || 1;

        this.pointerVec.x = ((clientX - rect.left - w / 2) / w) * 2;
        this.pointerVec.y = (-(clientY - rect.top - h / 2) / h) * 2;
    }

    private onTouchMove(event: TouchEvent) {
        if (!this.supportsTouch || !this.ready) {
            return;
        }

        const t = event.changedTouches[0];

        if (!t) {
            return;
        }

        this.ndcFromClient(t.clientX, t.clientY);
        this.raycaster.setFromCamera(this.pointerVec, this.camera);
        const hits = this.raycaster.intersectObject(this.dummyPlane);

        if (hits.length > 0) {
            const { x, y } = hits[0].point;

            this.simulationMaterial.uniforms.uMouse.value.set(x, y);
        }
    }

    private onPointerMove(event: PointerEvent) {
        if (this.supportsTouch || !this.ready) {
            return;
        }

        this.ndcFromClient(event.clientX, event.clientY);
        this.raycaster.setFromCamera(this.pointerVec, this.camera);
        const hits = this.raycaster.intersectObject(this.dummyPlane);

        if (hits.length > 0) {
            const { x, y } = hits[0].point;
            const mouse = this.simulationMaterial.uniforms.uMouse.value as Vector2;

            mouse.x = lerp(mouse.x, x, 0.15);
            mouse.y = lerp(mouse.y, y, 0.15);
        }
    }

    private renderFrame() {
        if (this.disposed) {
            return;
        }

        if (!this.ready) {
            this.renderer.clear();

            return;
        }

        const time = this.clock.getElapsedTime();

        this.renderer.setRenderTarget(this.renderTarget);
        this.renderer.clear();
        this.renderer.render(this.fboScene, this.fboCamera);
        this.renderer.setRenderTarget(null);

        this.pointsMaterial.uniforms.uPositions.value = this.renderTarget.texture;
        this.pointsMaterial.uniforms.uTime.value = time;
        this.simulationMaterial.uniforms.uTime.value = time;

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
        this.disposed = true;
        window.removeEventListener('resize', this.boundResize);
        this.canvas.removeEventListener('touchmove', this.boundTouchMove);
        this.canvas.removeEventListener('pointermove', this.boundPointerMove);

        this.renderer.setAnimationLoop(null);

        if (this.ready) {
            this.fboScene.remove(this.simulationMesh);
            this.simulationMesh.geometry.dispose();
            this.simulationMaterial.dispose();
            this.positionsTexture.dispose();
            this.renderTarget.dispose();

            this.scene.remove(this.points);
            this.points.geometry.dispose();
            this.pointsMaterial.dispose();
        }

        this.dummyPlane.geometry.dispose();
        (this.dummyPlane.material as MeshBasicMaterial).dispose();

        this.renderer.dispose();
    }
}

export default ParticlesModelShapeDemo;
