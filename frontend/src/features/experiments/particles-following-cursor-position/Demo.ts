import {
    ACESFilmicToneMapping,
    BufferGeometry,
    Clock,
    Color,
    Float32BufferAttribute,
    Mesh,
    MeshBasicMaterial,
    PerspectiveCamera,
    PlaneGeometry,
    Points,
    Raycaster,
    SRGBColorSpace,
    Scene,
    ShaderMaterial,
    Spherical,
    Vector2,
    Vector3,
    WebGLRenderer,
} from 'three';
import { Pane } from 'tweakpane';
import { lerp } from '@/shared/lib/math/lerp';
import fragmentShader from './shaders/fragment.glsl?raw';
import vertexShader from './shaders/vertex.glsl?raw';

function buildParticleGeometry(size: number): BufferGeometry {
    const length = size * size;
    const positions = new Float32Array(length * 3);
    const colors = new Float32Array(length * 3);
    const sizes = new Float32Array(length);
    const koefs = new Float32Array(length);

    for (let i = 0; i < length; i++) {
        const stride = i * 3;
        const spherical = new Spherical(0.4, Math.random() * Math.PI, Math.random() * Math.PI * 2);
        const vector = new Vector3().setFromSpherical(spherical);

        positions[stride + 0] = vector.x * Math.random();
        positions[stride + 1] = vector.y * Math.random();
        positions[stride + 2] = vector.z * Math.random();

        colors[stride + 0] = Math.random();
        colors[stride + 1] = Math.random();
        colors[stride + 2] = Math.random();

        sizes[i] = Math.random() * 0.5 + 0.5;
        koefs[i] = Math.random();
    }

    const geometry = new BufferGeometry();

    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geometry.setAttribute('aColor', new Float32BufferAttribute(colors, 3));
    geometry.setAttribute('aSize', new Float32BufferAttribute(sizes, 1));
    geometry.setAttribute('aKoef', new Float32BufferAttribute(koefs, 1));

    return geometry;
}

function viewportAtDistance(camera: PerspectiveCamera, distance: number) {
    const fov = (camera.fov * Math.PI) / 180;
    const h = 2 * Math.tan(fov / 2) * distance;
    const w = h * camera.aspect;

    return { width: w, height: h };
}

class Demo {
    readonly canvas: HTMLCanvasElement;
    private readonly renderer: WebGLRenderer;
    private readonly scene: Scene;
    private readonly camera: PerspectiveCamera;
    private readonly clock = new Clock();
    private prevTime = 0;
    private readonly raycaster = new Raycaster();
    private readonly pointerNdc = new Vector2();
    private readonly hitPlane: Mesh;
    private readonly points: Points<BufferGeometry, ShaderMaterial>;
    private tweakPane?: Pane;

    params = {
        size: 80,
        speed: 3,
    };

    get dpr() {
        return Math.min(window.devicePixelRatio, 2);
    }

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;

        this.renderer = new WebGLRenderer({
            canvas,
            alpha: false,
            antialias: false,
            powerPreference: 'high-performance',
        });
        this.renderer.outputColorSpace = SRGBColorSpace;
        this.renderer.toneMapping = ACESFilmicToneMapping;
        this.renderer.setPixelRatio(this.dpr);
        this.renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
        this.renderer.setClearColor(new Color('#0a0a0a'), 1);

        this.scene = new Scene();

        this.camera = new PerspectiveCamera(45, canvas.offsetWidth / canvas.offsetHeight, 0.1, 1000);
        this.camera.position.set(0, 0, 3);

        const dist = this.camera.position.z;
        const vp = viewportAtDistance(this.camera, dist);

        this.hitPlane = new Mesh(new PlaneGeometry(vp.width, vp.height), new MeshBasicMaterial({ visible: false }));
        this.scene.add(this.hitPlane);

        const material = new ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uPointer: { value: new Vector2() },
                uSpeed: { value: this.params.speed },
            },
            vertexShader,
            fragmentShader,
            depthWrite: false,
            transparent: true,
        });

        const geometry = buildParticleGeometry(this.params.size);

        this.points = new Points(geometry, material);
        this.scene.add(this.points);

        this.onPointerMove = this.onPointerMove.bind(this);
        this.onWindowResize = this.onWindowResize.bind(this);
        this.render = this.render.bind(this);

        canvas.addEventListener('pointermove', this.onPointerMove);
        window.addEventListener('resize', this.onWindowResize);

        this.initTweakPane();
        this.onWindowResize();

        this.renderer.setAnimationLoop(this.render);
    }

    private onPointerMove(event: PointerEvent) {
        const rect = this.canvas.getBoundingClientRect();

        this.pointerNdc.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.pointerNdc.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    onWindowResize() {
        const width = this.canvas.parentElement?.offsetWidth || 1;
        const height = this.canvas.parentElement?.offsetHeight || 1;

        this.renderer.setPixelRatio(this.dpr);
        this.renderer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        const dist = this.camera.position.z;
        const vp = viewportAtDistance(this.camera, dist);
        const g = this.hitPlane.geometry as PlaneGeometry;

        g.dispose();
        this.hitPlane.geometry = new PlaneGeometry(vp.width, vp.height);
    }

    private render() {
        const time = this.clock.getElapsedTime();
        const delta = time - this.prevTime;

        this.prevTime = time;

        this.raycaster.setFromCamera(this.pointerNdc, this.camera);
        const intersects = this.raycaster.intersectObject(this.hitPlane);

        const uPointer = this.points.material.uniforms.uPointer.value as Vector2;

        if (intersects.length > 0) {
            const { x, y } = intersects[0].point;

            uPointer.x = lerp(uPointer.x, x, delta * 1.5);
            uPointer.y = lerp(uPointer.y, y, delta * 1.5);
        }

        this.points.material.uniforms.uTime.value = time;

        this.renderer.render(this.scene, this.camera);
    }

    private rebuildParticles() {
        const old = this.points.geometry;

        this.points.geometry = buildParticleGeometry(this.params.size);
        old.dispose();
    }

    private initTweakPane() {
        this.tweakPane = new Pane({ title: 'Parameters', expanded: matchMedia('(min-width: 1200px)').matches });

        const folder = this.tweakPane.addFolder({ title: 'Particles' });

        folder.addBinding(this.params, 'size', { min: 0, max: 300, step: 1 }).on('change', () => {
            this.rebuildParticles();
        });

        folder.addBinding(this.params, 'speed', { min: 0, max: 10, step: 0.001 }).on('change', () => {
            this.points.material.uniforms.uSpeed.value = this.params.speed;
        });
    }

    destroy() {
        this.renderer.setAnimationLoop(null);
        this.canvas.removeEventListener('pointermove', this.onPointerMove);
        window.removeEventListener('resize', this.onWindowResize);

        this.tweakPane?.dispose();

        this.scene.remove(this.hitPlane);
        (this.hitPlane.geometry as PlaneGeometry).dispose();
        (this.hitPlane.material as MeshBasicMaterial).dispose();

        this.scene.remove(this.points);
        this.points.geometry.dispose();
        this.points.material.dispose();

        this.renderer.dispose();
    }
}

export default Demo;
