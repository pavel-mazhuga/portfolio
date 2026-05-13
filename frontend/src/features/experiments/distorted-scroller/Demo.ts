import { damp } from 'maath/easing';
import {
    Clock,
    Color,
    Group,
    LinearFilter,
    LinearMipmapLinearFilter,
    Mesh,
    PerspectiveCamera,
    PlaneGeometry,
    SRGBColorSpace,
    Scene,
    ShaderMaterial,
    Texture,
    TextureLoader,
    Vector2,
    WebGLRenderer,
} from 'three';
import { remap } from '@/shared/lib/math/remap';

const VERTEX_SHADER = /* glsl */ `
varying vec2 vUv;
varying float vPosZ;

uniform float uFactor;
uniform vec2 uPlaneSize;

void main() {
    vUv = uv;

    vec3 newPos = position;
    float dist = length(vec2(newPos.x - uFactor * (uPlaneSize.x / 2.) * 3., newPos.y));
    float zChange = 1. / pow(dist, 1.2) * (uPlaneSize.x / 3.);
    newPos.z += zChange;
    vPosZ = newPos.z;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.);
}
`;

const FRAGMENT_SHADER = /* glsl */ `
varying vec2 vUv;
varying float vPosZ;

vec2 coverTextureUv(vec2 imgSize, vec2 planeSize, vec2 ouv) {
    vec2 s = planeSize;
    vec2 i = imgSize;
    float rs = s.x / s.y;
    float ri = i.x / i.y;
    vec2 new = rs < ri ? vec2(i.x * s.y / i.y, s.y) : vec2(s.x, i.y * s.x / i.x);
    vec2 offset = (rs < ri ? vec2((new.x - s.x) / 2.0, 0.0) : vec2(0.0, (new.y - s.y) / 2.0)) / new;
    vec2 uv = ouv * s / new + offset;

    return uv;
}

vec3 grayscale(vec3 color, float str) {
    float g = dot(color, vec3(0.299, 0.587, 0.114));
    return mix(color, vec3(g), str);
}

vec4 coverTexture(sampler2D tex, vec2 imgSize, vec2 planeSize, vec2 ouv) {
    return texture(tex, coverTextureUv(imgSize, planeSize, ouv));
}

uniform float uFactor;
uniform vec2 uPlaneSize;
uniform sampler2D uImage;
uniform vec2 uImageSize;
uniform float uTime;

void main() {
    vec2 uv = vUv;
    vec4 color = coverTexture(uImage, uImageSize, uPlaneSize, uv);
    color.rgb = grayscale(color.rgb, 1. - clamp(vPosZ, 0., 1.));

    gl_FragColor = color;
    #include <colorspace_fragment>
}
`;

const GAP = 0.15;
const SCROLL_DISTANCE = 0.7;
const SCROLL_DAMPING = 0.1;
const SCROLL_EPS = 1e-5;

const SCROLLER_PLANE_SCALE = 2;

function scrollRange(offset: number, index: number, imageCount: number): number {
    const from = 0.1 * index - 0.11 * (1 - (index + 1) / imageCount);
    const distance = 0.3;
    const start = from;
    const end = start + distance;

    if (offset < start) return 0;

    if (offset > end) return 1;

    return (offset - start) / (end - start);
}

const SCROLLER_IMAGES = [
    'https://images.unsplash.com/photo-1529611355777-315dad1f9f4d?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8aGQlMjBjYXJ8ZW58MHx8MHx8fDA%3D',
    'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?q=80&w=2720&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1523299655748-ec4fc1d377c1?q=80&w=3432&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1643694985710-4e26a746734b?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1531435892188-1e695988a243?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1693485320289-70e5c29726b3?q=80&w=3552&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1695192193767-54887768f845?q=80&w=3328&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1704174840778-f014998a38f3?q=80&w=3432&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'https://images.unsplash.com/photo-1681869916819-cb81574a02e7?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
];

class DistortedScrollerDemo {
    private readonly canvas: HTMLCanvasElement;
    private readonly renderer: WebGLRenderer;
    private readonly scene: Scene;
    private readonly camera: PerspectiveCamera;
    private readonly clock = new Clock();
    private readonly boundResize: () => void;
    private readonly uTimeUniform = { value: 0 };
    private readonly images: string[];
    private planeSize: Vector2;
    private readonly sliderGroup: Group;
    private scrollEl: HTMLDivElement | null = null;
    private fillEl: HTMLDivElement | null = null;
    private rawScroll = 0;
    private readonly scrollState = { offset: 0 };
    private pages = 1;
    private slideMeshes: Mesh<PlaneGeometry, ShaderMaterial>[] = [];
    private slideGeometry: PlaneGeometry | null = null;
    private disposed = false;
    private wheelHandler: ((e: WheelEvent) => void) | null = null;
    private scrollHandler: (() => void) | null = null;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.images = SCROLLER_IMAGES;
        this.planeSize = new Vector2(1, 0.5625).multiplyScalar(SCROLLER_PLANE_SCALE);

        this.renderer = new WebGLRenderer({
            canvas,
            alpha: false,
            antialias: true,
            powerPreference: 'high-performance',
        });
        this.renderer.outputColorSpace = SRGBColorSpace;

        this.scene = new Scene();
        this.scene.background = new Color(0x000000);

        const width = canvas.parentElement?.offsetWidth || 1;
        const height = canvas.parentElement?.offsetHeight || 1;

        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(width, height);

        this.camera = new PerspectiveCamera(45, width / height, 0.1, 1000);
        this.camera.position.set(0, 0, 5);

        this.sliderGroup = new Group();
        this.scene.add(this.sliderGroup);

        this.boundResize = () => this.onWindowResize();
        window.addEventListener('resize', this.boundResize);

        void this.bootstrap();

        this.renderer.setAnimationLoop(() => this.renderFrame());
    }

    private getViewportWidth(): number {
        const dist = Math.abs(this.camera.position.z);
        const vFov = (this.camera.fov * Math.PI) / 180;
        const viewportHeight = 2 * Math.tan(vFov / 2) * dist;

        return viewportHeight * this.camera.aspect;
    }

    private computePages(): number {
        const vw = this.getViewportWidth();
        const n = this.images.length;

        return (vw + (n - 1) * (this.planeSize.x + GAP)) / vw;
    }

    private syncScrollDomSize() {
        if (!this.scrollEl || !this.fillEl) return;

        this.pages = this.computePages();
        this.fillEl.style.width = `${this.pages * SCROLL_DISTANCE * 100}%`;
        const maxScroll = Math.max(0, this.scrollEl.scrollWidth - this.scrollEl.clientWidth);

        if (maxScroll <= 0) {
            this.rawScroll = 0;
        } else {
            this.rawScroll = Math.min(1, Math.max(0, this.scrollEl.scrollLeft / maxScroll));
        }
    }

    private setupScrollDom() {
        const parent = this.canvas.parentElement;

        if (!parent) return;

        const el = document.createElement('div');

        el.style.position = 'absolute';
        el.style.width = '100%';
        el.style.height = '100%';
        el.style.top = '0';
        el.style.left = '0';
        el.style.overflowX = 'auto';
        el.style.overflowY = 'hidden';

        const fixed = document.createElement('div');

        fixed.style.position = 'sticky';
        fixed.style.top = '0';
        fixed.style.left = '0';
        fixed.style.width = '100%';
        fixed.style.height = '100%';
        fixed.style.overflow = 'hidden';

        const fill = document.createElement('div');

        fill.style.height = '100%';
        fill.style.pointerEvents = 'none';

        el.appendChild(fixed);
        el.appendChild(fill);
        parent.appendChild(el);

        el.scrollLeft = 1;
        let firstRun = true;

        this.scrollHandler = () => {
            if (firstRun) return;

            const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth);

            if (maxScroll <= 0) this.rawScroll = 0;
            else this.rawScroll = el.scrollLeft / maxScroll;
        };
        el.addEventListener('scroll', this.scrollHandler, { passive: true });
        requestAnimationFrame(() => {
            firstRun = false;
        });

        this.wheelHandler = (e: WheelEvent) => {
            el.scrollLeft += e.deltaY / 2;
        };
        el.addEventListener('wheel', this.wheelHandler, { passive: true });

        this.scrollEl = el;
        this.fillEl = fill;
        this.syncScrollDomSize();
    }

    private async bootstrap() {
        const loader = new TextureLoader();

        loader.setCrossOrigin('anonymous');

        const textures = await Promise.all(
            this.images.map(
                (url) =>
                    new Promise<Texture>((resolve, reject) => {
                        loader.load(url, resolve, undefined, reject);
                    }),
            ),
        );

        if (this.disposed) {
            textures.forEach((t) => t.dispose());

            return;
        }

        for (const tex of textures) {
            tex.colorSpace = SRGBColorSpace;
            tex.minFilter = LinearMipmapLinearFilter;
            tex.magFilter = LinearFilter;
            tex.generateMipmaps = true;
        }

        this.slideGeometry = new PlaneGeometry(this.planeSize.x, this.planeSize.y, 128);
        const n = this.images.length;

        for (let i = 0; i < n; i++) {
            const img = textures[i].image as HTMLImageElement;
            const material = new ShaderMaterial({
                uniforms: {
                    uImage: { value: textures[i] },
                    uImageSize: { value: new Vector2(img.naturalWidth || 1, img.naturalHeight || 1) },
                    uPlaneSize: { value: this.planeSize.clone() },
                    uTime: this.uTimeUniform,
                    uFactor: { value: 0 },
                },
                vertexShader: VERTEX_SHADER,
                fragmentShader: FRAGMENT_SHADER,
            });

            const mesh = new Mesh(this.slideGeometry, material);

            mesh.position.x = (this.planeSize.x + GAP) * i;
            this.sliderGroup.add(mesh);
            this.slideMeshes.push(mesh);
        }

        this.setupScrollDom();
    }

    private updateSlideFactors() {
        const offset = this.scrollState.offset;
        const n = this.slideMeshes.length;

        for (let i = 0; i < n; i++) {
            const r = scrollRange(offset, i, n);

            this.slideMeshes[i].material.uniforms.uFactor.value = remap(r, [0, 1], [-1, 1]);
        }
    }

    private renderFrame() {
        const delta = this.clock.getDelta();

        damp(this.scrollState, 'offset', this.rawScroll, SCROLL_DAMPING, delta, Infinity, undefined, SCROLL_EPS);

        const vw = this.getViewportWidth();

        this.sliderGroup.position.x = -vw * (this.pages - 1) * this.scrollState.offset;

        this.uTimeUniform.value = this.clock.getElapsedTime();
        this.updateSlideFactors();

        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        const width = this.canvas.parentElement?.offsetWidth || 1;
        const height = this.canvas.parentElement?.offsetHeight || 1;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(width, height);
        this.syncScrollDomSize();

        for (const mesh of this.slideMeshes) {
            const img = mesh.material.uniforms.uImage.value as Texture;
            const el = img.image as HTMLImageElement;

            mesh.material.uniforms.uImageSize.value.set(el.naturalWidth || 1, el.naturalHeight || 1);
        }
    }

    destroy() {
        this.disposed = true;
        window.removeEventListener('resize', this.boundResize);
        this.renderer.setAnimationLoop(null);

        if (this.scrollEl && this.scrollHandler) {
            this.scrollEl.removeEventListener('scroll', this.scrollHandler);
        }

        if (this.scrollEl && this.wheelHandler) {
            this.scrollEl.removeEventListener('wheel', this.wheelHandler);
        }

        if (this.scrollEl?.parentElement) {
            this.scrollEl.parentElement.removeChild(this.scrollEl);
        }

        this.scrollEl = null;
        this.fillEl = null;

        this.scene.remove(this.sliderGroup);

        for (const mesh of this.slideMeshes) {
            mesh.material.dispose();
            const tex = mesh.material.uniforms.uImage.value as Texture;

            tex.dispose();
        }

        this.slideGeometry?.dispose();
        this.slideGeometry = null;
        this.slideMeshes = [];

        this.renderer.dispose();
    }
}

export default DistortedScrollerDemo;
