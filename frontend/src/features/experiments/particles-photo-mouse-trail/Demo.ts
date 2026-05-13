import {
    BufferAttribute,
    CanvasTexture,
    Clock,
    Mesh,
    MeshBasicMaterial,
    NoToneMapping,
    PerspectiveCamera,
    PlaneGeometry,
    Points,
    Raycaster,
    SRGBColorSpace,
    Scene,
    ShaderMaterial,
    Texture,
    TextureLoader,
    Vector2,
    WebGLRenderer,
} from 'three';
import { FRAGMENT_SHADER, VERTEX_SHADER } from './particlesPhotoMouseTrailShaders';

const PICTURE_URL =
    'https://images.unsplash.com/photo-1649706796644-c507eb2835bb?q=80&w=3121&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';

export type ParticlesPhotoMouseTrailParams = {
    trailSize: number;
    trailSpeed: number;
    displacementIntensity: number;
    noisePower: number;
    noiseStrength: number;
    noiseSpeed: number;
    particleSizeDependsOnBrightness: boolean;
    grayscale: boolean;
    sickMode: boolean;
};

export type ParticlesPhotoMouseTrailDemoOptions = {
    params?: Partial<ParticlesPhotoMouseTrailParams>;
    onReady?: () => void;
};

const defaultParams = (): ParticlesPhotoMouseTrailParams => ({
    trailSize: 0.45,
    trailSpeed: 0.03,
    displacementIntensity: 3,
    noisePower: 1,
    noiseStrength: 0.1,
    noiseSpeed: 0.1,
    grayscale: false,
    sickMode: false,
    particleSizeDependsOnBrightness: false,
});

const createDisplacementCanvas = (width: number, height: number) => {
    const canvas = document.createElement('canvas');

    canvas.width = Math.max(1, Math.floor(width));
    canvas.height = Math.max(1, Math.floor(height));

    const glowImage = new Image();

    glowImage.src = '/static/img/glow.png';

    return { canvas, ctx: canvas.getContext('2d'), glowImage };
};

class ParticlesPhotoMouseTrailDemo {
    private readonly canvas: HTMLCanvasElement;
    private readonly renderer: WebGLRenderer;
    private readonly scene: Scene;
    private readonly camera: PerspectiveCamera;
    private readonly clock = new Clock();
    private readonly raycaster = new Raycaster();
    private readonly pointerNdc = new Vector2();
    private readonly canvasCursor = new Vector2(9999, 9999);
    private readonly canvasCursorPrevious = new Vector2(9999, 9999);
    private readonly boundResize: () => void;
    private readonly boundPointerMove: (e: PointerEvent) => void;
    private readonly boundPointerLeave: () => void;

    private readonly particleAmount: number;
    private params: ParticlesPhotoMouseTrailParams;

    private interactivePlane: Mesh<PlaneGeometry, MeshBasicMaterial> | null = null;
    private points: Points<PlaneGeometry, ShaderMaterial> | null = null;
    private material: ShaderMaterial | null = null;
    private canvasTexture: CanvasTexture | null = null;
    private pictureTexture: Texture | null = null;
    private displacementCtx: CanvasRenderingContext2D | null = null;
    private displacementCanvas: HTMLCanvasElement | null = null;
    private glowImage: HTMLImageElement | null = null;

    private prevCursorDistance = 0;
    private disposed = false;
    private ready = false;
    private readonly onReady?: () => void;

    constructor(canvas: HTMLCanvasElement, particleAmount = 256, options?: ParticlesPhotoMouseTrailDemoOptions) {
        this.canvas = canvas;
        this.particleAmount = particleAmount;
        this.params = { ...defaultParams(), ...options?.params };
        this.onReady = options?.onReady;

        this.renderer = new WebGLRenderer({
            canvas,
            alpha: false,
            antialias: false,
            powerPreference: 'high-performance',
        });
        this.renderer.toneMapping = NoToneMapping;
        this.renderer.outputColorSpace = SRGBColorSpace;

        const width = canvas.parentElement?.offsetWidth || 1;
        const height = canvas.parentElement?.offsetHeight || 1;

        this.renderer.setPixelRatio(Math.max(1, Math.min(window.devicePixelRatio, 1.5)));
        this.renderer.setSize(width, height);

        this.scene = new Scene();

        this.camera = new PerspectiveCamera(35, width / height, 0.1, 1000);
        this.camera.position.set(0, 0, 18);

        this.boundResize = () => this.onWindowResize();
        this.boundPointerMove = (e: PointerEvent) => this.onPointerMove(e);
        this.boundPointerLeave = () => this.onPointerLeave();

        window.addEventListener('resize', this.boundResize);
        this.canvas.addEventListener('pointermove', this.boundPointerMove);
        this.canvas.addEventListener('pointerleave', this.boundPointerLeave);

        void this.bootstrap();
    }

    private onPointerMove(e: PointerEvent) {
        const rect = this.canvas.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        this.pointerNdc.set(x, y);
    }

    private onPointerLeave() {
        this.pointerNdc.set(9999, 9999);
    }

    private async bootstrap() {
        const loader = new TextureLoader();

        loader.setCrossOrigin('anonymous');

        const picturePromise = new Promise<Texture>((resolve, reject) => {
            loader.load(
                PICTURE_URL,
                (tex) => {
                    tex.colorSpace = SRGBColorSpace;
                    resolve(tex);
                },
                undefined,
                reject,
            );
        });

        const {
            canvas: dispCanvas,
            ctx,
            glowImage,
        } = createDisplacementCanvas(this.particleAmount, this.particleAmount);

        this.displacementCanvas = dispCanvas;
        this.displacementCtx = ctx;
        this.glowImage = glowImage;

        const glowPromise = new Promise<void>((resolve, reject) => {
            const done = () => resolve();

            if (glowImage.complete && glowImage.naturalWidth > 0) {
                done();
            } else {
                glowImage.onload = done;
                glowImage.onerror = () => reject(new Error('Failed to load glow image'));
            }
        });

        try {
            const pictureTexture = await picturePromise;

            await glowPromise;

            if (this.disposed) {
                pictureTexture.dispose();

                return;
            }

            this.pictureTexture = pictureTexture;
            this.finishSetup();
        } catch {
            if (!this.disposed) {
                // eslint-disable-next-line no-console
                console.error('ParticlesPhotoMouseTrail: failed to load assets');
            }

            this.safeOnReady();
        }
    }

    private safeOnReady() {
        if (!this.disposed) {
            this.onReady?.();
        }
    }

    private finishSetup() {
        if (
            this.disposed ||
            !this.pictureTexture ||
            !this.displacementCanvas ||
            !this.displacementCtx ||
            !this.glowImage
        ) {
            return;
        }

        const planeSize = { width: 10, height: 10 };
        const geometry = new PlaneGeometry(planeSize.width, planeSize.height, this.particleAmount, this.particleAmount);

        geometry.setIndex(null);
        geometry.deleteAttribute('normal');

        const count = geometry.attributes.position.count;
        const intensitiesArray = new Float32Array(count);
        const anglesArray = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            intensitiesArray[i] = Math.random();
            anglesArray[i] = Math.random() * Math.PI * 2;
        }

        geometry.setAttribute('aIntensity', new BufferAttribute(intensitiesArray, 1));
        geometry.setAttribute('aAngle', new BufferAttribute(anglesArray, 1));

        this.canvasTexture = new CanvasTexture(this.displacementCanvas);

        const img = this.pictureTexture.image as HTMLImageElement;
        const imageW = img.naturalWidth || img.width || 1;
        const imageH = img.naturalHeight || img.height || 1;

        this.material = new ShaderMaterial({
            uniforms: {
                uResolution: { value: new Vector2() },
                uPictureTexture: { value: this.pictureTexture },
                uImageSize: { value: new Vector2(imageW, imageH) },
                uPlaneSize: { value: new Vector2(planeSize.width, planeSize.height) },
                uDisplacementTexture: { value: this.canvasTexture },
                uTime: { value: 0 },
                uDisplacementIntensity: { value: this.params.displacementIntensity },
                uNoisePower: { value: this.params.noisePower },
                uNoiseStrength: { value: this.params.noiseStrength },
                uNoiseSpeed: { value: this.params.noiseSpeed },
                uSickMode: { value: this.params.sickMode },
                uGrayscale: { value: this.params.grayscale },
                uDependParticleSizeOnBrightness: { value: this.params.particleSizeDependsOnBrightness },
            },
            vertexShader: VERTEX_SHADER,
            fragmentShader: FRAGMENT_SHADER,
            depthWrite: false,
        });

        this.points = new Points(geometry, this.material);
        this.scene.add(this.points);

        this.interactivePlane = new Mesh(new PlaneGeometry(planeSize.width, planeSize.height), new MeshBasicMaterial());

        this.ready = true;
        this.renderer.setAnimationLoop(() => this.renderFrame());
        this.safeOnReady();
    }

    private renderFrame() {
        if (
            !this.ready ||
            !this.material ||
            !this.canvasTexture ||
            !this.displacementCtx ||
            !this.displacementCanvas ||
            !this.glowImage ||
            !this.interactivePlane
        ) {
            return;
        }

        this.raycaster.setFromCamera(this.pointerNdc, this.camera);
        const intersections = this.raycaster.intersectObject(this.interactivePlane);

        if (intersections.length) {
            const uv = intersections[0].uv;

            if (uv && this.displacementCanvas) {
                this.canvasCursor.x = uv.x * this.displacementCanvas.width;
                this.canvasCursor.y = (1 - uv.y) * this.displacementCanvas.height;
            }
        }

        const ctx = this.displacementCtx;
        const canvas = this.displacementCanvas;
        const glowImage = this.glowImage;

        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = this.params.trailSpeed;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        let cursorDistance = this.canvasCursorPrevious.distanceTo(this.canvasCursor);
        const savedCursorDistance = cursorDistance;

        if (cursorDistance > 10 && this.prevCursorDistance === 0) {
            cursorDistance = 0;
        }

        this.prevCursorDistance = savedCursorDistance;

        this.canvasCursorPrevious.copy(this.canvasCursor);
        const alpha = Math.min(cursorDistance * 0.05, 1);

        const glowSize = canvas.width * this.params.trailSize;

        ctx.globalCompositeOperation = 'lighten';
        ctx.globalAlpha = alpha;
        ctx.drawImage(
            glowImage,
            this.canvasCursor.x - glowSize * 0.5,
            this.canvasCursor.y - glowSize * 0.5,
            glowSize,
            glowSize,
        );

        this.canvasTexture.needsUpdate = true;

        const u = this.material.uniforms;

        u.uTime.value = this.clock.getElapsedTime();
        u.uDisplacementIntensity.value = this.params.displacementIntensity;
        u.uNoisePower.value = this.params.noisePower;
        u.uNoiseStrength.value = this.params.noiseStrength;
        u.uNoiseSpeed.value = this.params.noiseSpeed;
        u.uDependParticleSizeOnBrightness.value = this.params.particleSizeDependsOnBrightness;
        u.uGrayscale.value = this.params.grayscale;
        u.uSickMode.value = this.params.sickMode;

        u.uResolution.value.set(this.renderer.domElement.width, this.renderer.domElement.height);

        this.renderer.render(this.scene, this.camera);
    }

    updateParams(p: Partial<ParticlesPhotoMouseTrailParams>) {
        this.params = { ...this.params, ...p };
    }

    onWindowResize() {
        const width = this.canvas.parentElement?.offsetWidth || 1;
        const height = this.canvas.parentElement?.offsetHeight || 1;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setPixelRatio(Math.max(1, Math.min(window.devicePixelRatio, 1.5)));
        this.renderer.setSize(width, height);
    }

    destroy() {
        this.disposed = true;
        window.removeEventListener('resize', this.boundResize);
        this.canvas.removeEventListener('pointermove', this.boundPointerMove);
        this.canvas.removeEventListener('pointerleave', this.boundPointerLeave);
        this.renderer.setAnimationLoop(null);

        if (this.points) {
            this.scene.remove(this.points);
            this.points.geometry.dispose();
            this.points = null;
        }

        if (this.material) {
            this.material.dispose();
            this.material = null;
        }

        if (this.canvasTexture) {
            this.canvasTexture.dispose();
            this.canvasTexture = null;
        }

        if (this.pictureTexture) {
            this.pictureTexture.dispose();
            this.pictureTexture = null;
        }

        if (this.interactivePlane) {
            this.interactivePlane.geometry.dispose();
            this.interactivePlane.material.dispose();
            this.interactivePlane = null;
        }

        this.displacementCanvas = null;
        this.displacementCtx = null;
        this.glowImage = null;

        this.renderer.dispose();
    }
}

export default ParticlesPhotoMouseTrailDemo;
