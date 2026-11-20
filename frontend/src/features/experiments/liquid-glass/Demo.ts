import { Pane } from 'tweakpane';
import './liquid-glass.css';
import { PAGE_LENGTH } from './backdrop';
import { ensureHtmlInCanvas, wantsCssFallback } from './ensure-html-in-canvas';
import { fillLensMap, GLASS, type GlassParams } from './lens';

/** Capture raster zoom — smaller HTML→GPU texture; scroll still UV-only. */
const CAPTURE_ZOOM = 0.5;
/** Dual-Kawase pyramid depth ceiling (paint-only). */
const BLUR_MAX_LEVELS = 5;

const VERT = /* glsl */ `#version 300 es
layout(location = 0) in vec2 aPosition;
void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

// Dual-filter Kawase — down then up. Paint/slider only.
const BLUR_FRAG = /* glsl */ `#version 300 es
precision highp float;

uniform sampler2D uInput;
uniform vec2 uResolution;
uniform vec2 uTexel;
uniform float uOffset;
uniform float uMode; // 0 = downsample, 1 = upsample

out vec4 fragColor;

vec4 downsample(vec2 uv, vec2 halfp) {
    vec4 sum = texture(uInput, uv) * 4.0;
    sum += texture(uInput, uv - halfp);
    sum += texture(uInput, uv + halfp);
    sum += texture(uInput, uv + vec2(halfp.x, -halfp.y));
    sum += texture(uInput, uv - vec2(halfp.x, -halfp.y));
    return sum * 0.125;
}

vec4 upsample(vec2 uv, vec2 halfp) {
    vec4 sum = texture(uInput, uv + vec2(-halfp.x * 2.0, 0.0));
    sum += texture(uInput, uv + vec2(-halfp.x, halfp.y)) * 2.0;
    sum += texture(uInput, uv + vec2(0.0, halfp.y * 2.0));
    sum += texture(uInput, uv + vec2(halfp.x, halfp.y)) * 2.0;
    sum += texture(uInput, uv + vec2(halfp.x * 2.0, 0.0));
    sum += texture(uInput, uv + vec2(halfp.x, -halfp.y)) * 2.0;
    sum += texture(uInput, uv + vec2(0.0, -halfp.y * 2.0));
    sum += texture(uInput, uv + vec2(-halfp.x, -halfp.y)) * 2.0;
    return sum / 12.0;
}

void main() {
    vec2 uv = gl_FragCoord.xy / uResolution;
    vec2 halfp = uTexel * uOffset;
    fragColor = uMode < 0.5 ? downsample(uv, halfp) : upsample(uv, halfp);
}
`;

// gentpan/liquidglass WebGL pass. Map from fillLensMap() in lens.ts.
// Page texture is top-down HTML. uScroll is top of the visible window in texture px.
// uTexScale maps full-res canvas frag px into a zoomed capture texture.
// Blur is Dual-Kawase on paint; glass does 1 sample/channel.
const GLASS_FRAG = /* glsl */ `#version 300 es
precision highp float;

uniform sampler2D uBackdrop;
uniform sampler2D uMap;
uniform vec2 uResolution;
uniform vec2 uPageSize;
uniform float uScroll;
uniform vec2 uTexScale;
uniform vec4 uBox;
uniform vec3 uScale;
uniform float uLodBias;

out vec4 fragColor;

vec2 pageUv(vec2 frag) {
    return clamp(
        vec2(
            frag.x * uTexScale.x / uPageSize.x,
            (uScroll + (uResolution.y - frag.y) * uTexScale.y) / uPageSize.y
        ),
        0.0,
        1.0
    );
}

vec3 sampleBackdrop(vec2 frag) {
    return texture(uBackdrop, pageUv(frag), uLodBias).rgb;
}

void main() {
    vec2 frag = gl_FragCoord.xy;
    vec2 mapUv = vec2((frag.x - uBox.x) / uBox.z, (uBox.y + uBox.w - frag.y) / uBox.w);

    if (mapUv.x < 0.0 || mapUv.y < 0.0 || mapUv.x > 1.0 || mapUv.y > 1.0) {
        discard;
    }

    vec4 map = texture(uMap, mapUv);

    if (map.a <= 0.0) {
        discard;
    }

    vec2 bend = map.rg - vec2(0.5019608);
    vec2 dir = vec2(bend.x, -bend.y);
    vec3 color = vec3(
        sampleBackdrop(frag + dir * uScale.r).r,
        sampleBackdrop(frag + dir * uScale.g).g,
        sampleBackdrop(frag + dir * uScale.b).b
    );
    float rim = max(0.0, map.b * 2.0 - 1.0039216);

    color = min(vec3(1.0), color + rim);
    fragColor = vec4(color * map.a, map.a);
}
`;

type Spring = {
    value: number;
    velocity: number;
    target: number;
};

type GlassUniforms = {
    backdrop: WebGLUniformLocation;
    map: WebGLUniformLocation;
    resolution: WebGLUniformLocation;
    pageSize: WebGLUniformLocation;
    scroll: WebGLUniformLocation;
    texScale: WebGLUniformLocation; // vec2: canvas-frag → page-tex scale per axis
    box: WebGLUniformLocation;
    scale: WebGLUniformLocation;
    lodBias: WebGLUniformLocation;
};

type BlurUniforms = {
    input: WebGLUniformLocation;
    resolution: WebGLUniformLocation;
    texel: WebGLUniformLocation;
    offset: WebGLUniformLocation;
    mode: WebGLUniformLocation;
};

type PaintableCanvas = HTMLCanvasElement & {
    requestPaint?: () => void;
    getElementImageDefaultSize?: (element: Element) => { width: number; height: number };
    content?: string;
};

type ElementGl = WebGL2RenderingContext & {
    texElementSubImage2D: (target: number, level: number, xoffset: number, yoffset: number, element: Element) => void;
};

function spring(value: number): Spring {
    return { value, velocity: 0, target: value };
}

function stepSpring(state: Spring, dt: number, omega: number, zeta: number): boolean {
    const displacement = state.value - state.target;
    const accel = -2 * zeta * omega * state.velocity - omega * omega * displacement;

    state.velocity += accel * dt;
    state.value += state.velocity * dt;

    if (Math.abs(state.value - state.target) < 0.0008 && Math.abs(state.velocity) < 0.0008) {
        state.value = state.target;
        state.velocity = 0;

        return false;
    }

    return true;
}

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
    const shader = gl.createShader(type);

    if (!shader) {
        throw new Error('shader');
    }

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(shader) ?? 'compile';

        gl.deleteShader(shader);
        throw new Error(log);
    }

    return shader;
}

function link(gl: WebGL2RenderingContext, vert: WebGLShader, frag: WebGLShader): WebGLProgram {
    const program = gl.createProgram();

    if (!program) {
        throw new Error('program');
    }

    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);
    gl.deleteShader(vert);
    gl.deleteShader(frag);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const log = gl.getProgramInfoLog(program) ?? 'link';

        gl.deleteProgram(program);
        throw new Error(log);
    }

    return program;
}

function uniform(gl: WebGL2RenderingContext, program: WebGLProgram, name: string): WebGLUniformLocation {
    const location = gl.getUniformLocation(program, name);

    if (!location) {
        throw new Error(name);
    }

    return location;
}

function makeTexture(gl: WebGL2RenderingContext): WebGLTexture {
    const texture = gl.createTexture();

    if (!texture) {
        throw new Error('texture');
    }

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    return texture;
}

function canTexElement(gl: WebGL2RenderingContext | null): gl is ElementGl {
    return Boolean(gl && typeof (gl as ElementGl).texElementSubImage2D === 'function');
}

type Drawable2D = CanvasRenderingContext2D & {
    drawElementImage: (element: Element, dx: number, dy: number, dw?: number, dh?: number) => void;
};

function canDrawElement(ctx: CanvasRenderingContext2D | null): ctx is Drawable2D {
    return Boolean(ctx && typeof (ctx as Drawable2D).drawElementImage === 'function');
}

function readCssPx(value: string, fallback: number): number {
    const n = parseFloat(value);

    return Number.isFinite(n) ? n : fallback;
}

type LensButton = {
    el: HTMLButtonElement;
    labelOff: string;
    labelOn: string;
    scaleX: Spring;
    scaleY: Spring;
    pressed: boolean;
    hovered: boolean;
    appliedScaleX: number;
    appliedScaleY: number;
};

export default class LiquidGlassDemo {
    private readonly canvas: PaintableCanvas;
    private readonly root: HTMLElement;
    private readonly bar: HTMLDivElement;
    private readonly buttons: LensButton[];
    /** Visible selectable page under the transparent WebGL canvas. */
    private readonly live: HTMLDivElement;
    /** Drawable capture page inside the WebGL canvas (texElementSubImage2D source). */
    private readonly capture: HTMLDivElement;
    private readonly reduceMotion: boolean;
    private readonly params: GlassParams = { ...GLASS };
    private tweakPane?: Pane;
    private scrollY = 0;

    private gl: ElementGl | null = null;
    private glassProgram: WebGLProgram | null = null;
    private blurProgram: WebGLProgram | null = null;
    private vao: WebGLVertexArrayObject | null = null;
    private buffer: WebGLBuffer | null = null;
    private texture: WebGLTexture | null = null;
    private mapTexture: WebGLTexture | null = null;
    /** Dual-Kawase pyramid: [0]=full capture out, [1]=½, [2]=¼, … */
    private blurMips: WebGLTexture[] = [];
    private blurMipW: number[] = [];
    private blurMipH: number[] = [];
    private blurFbo: WebGLFramebuffer | null = null;
    private glassUniforms: GlassUniforms | null = null;
    private blurUniforms: BlurUniforms | null = null;
    private mapKey = '';
    private texW = 0;
    private texH = 0;
    private pageTexW = 1;
    private pageTexH = 1;
    private texScaleX = 1;
    private texScaleY = 1;
    private useBlur = false;
    /** Cached glass quads — bar is position:fixed, skip layout reads on scroll. */
    private glassLayout: {
        scaleX: number;
        scaleY: number;
        boxes: {
            boxX: number;
            boxY: number;
            boxW: number;
            boxH: number;
            scissorX: number;
            scissorY: number;
            scissorW: number;
            scissorH: number;
            cssW: number;
            cssH: number;
            mapW: number;
            mapH: number;
            radius: number;
        }[];
    } | null = null;
    private html = false;
    private cssMode = false;
    private polyfilled = false;
    private raster: HTMLCanvasElement | null = null;
    private rasterCtx: Drawable2D | null = null;
    private disposed = false;
    private running = false;
    private raf = 0;
    private last = 0;
    private dpr = 1;

    private readonly rootObserver = new ResizeObserver((entries) => this.onRootResize(entries[0]));
    private readonly buttonObserver = new ResizeObserver(() => {
        this.glassLayout = null;
        this.requestFrame();
    });

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.root = canvas.parentElement ?? document.body;
        this.reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.root.classList.add('lg-root');

        this.canvas.setAttribute('content', 'drawable');
        this.canvas.classList.add('lg-canvas');

        const live = this.root.querySelector<HTMLDivElement>('.js-lg-page');
        const bar = this.root.querySelector<HTMLDivElement>('.js-lg-bar');

        if (!live || !bar) {
            throw new Error('liquid-glass Markup.astro missing (.js-lg-page / .js-lg-bar)');
        }

        this.live = live;
        this.bar = bar;
        this.buttons = [...bar.querySelectorAll<HTMLButtonElement>('.js-lg-button')].map((el) => this.bindButton(el));

        if (this.buttons.length < 1) {
            throw new Error('liquid-glass Markup.astro missing .js-lg-button');
        }

        this.capture = live.cloneNode(true) as HTMLDivElement;
        this.capture.classList.remove('lg-page--dom');
        this.capture.classList.remove('js-lg-page');
        this.capture.setAttribute('aria-hidden', 'true');

        // Native / polyfill before WebGL context — CSS flag skips HTML-in-Canvas entirely.
        const hic = ensureHtmlInCanvas();

        this.polyfilled = Boolean(hic?.polyfilled);
        this.texScaleX = CAPTURE_ZOOM;
        this.texScaleY = CAPTURE_ZOOM;

        if (!this.polyfilled) {
            this.capture.style.zoom = String(CAPTURE_ZOOM);
        }

        this.gl = this.canvas.getContext('webgl2', {
            alpha: true,
            antialias: false,
            depth: false,
            stencil: false,
            premultipliedAlpha: true,
            preserveDrawingBuffer: false,
        }) as ElementGl | null;

        const canHtml =
            !wantsCssFallback() && this.canvas.content === 'drawable' && (this.polyfilled || canTexElement(this.gl));

        if (canHtml && this.gl) {
            this.html = true;

            try {
                if (this.polyfilled) {
                    this.mountRasterCapture();
                } else {
                    this.canvas.append(this.capture);
                    this.canvas.addEventListener('paint', this.onPaint);
                }

                if (!this.initGl(this.gl)) {
                    this.enableCss();
                }
            } catch {
                this.enableCss();
            }
        } else {
            this.enableCss();
        }

        this.bindInput();
        this.initTweakPane();
        this.onRootResize();
        void document.fonts.ready.then(() => {
            if (!this.disposed) {
                this.requestPaint();
            }
        });
    }

    destroy() {
        if (this.disposed) {
            return;
        }

        this.disposed = true;
        this.tweakPane?.dispose();
        cancelAnimationFrame(this.raf);
        this.rootObserver.disconnect();
        this.buttonObserver.disconnect();
        this.unbindInput();
        this.teardownPaintSource();
        this.capture.remove();
        this.raster?.remove();
        this.raster = null;
        this.rasterCtx = null;
        this.canvas.removeAttribute('content');
        this.canvas.classList.remove('lg-canvas');
        this.canvas.hidden = false;
        this.canvas.style.cssText = '';
        this.root.classList.remove('lg-root');
        this.root.scrollTop = 0;

        for (const btn of this.buttons) {
            btn.el.classList.remove('lg-button--css');
            btn.el.style.transform = '';
            btn.el.textContent = btn.labelOff;
            btn.el.setAttribute('aria-pressed', 'false');
        }

        this.deleteGl();
    }

    private mountRasterCapture() {
        const raster = document.createElement('canvas');

        raster.className = 'lg-raster';
        raster.setAttribute('content', 'drawable');
        raster.setAttribute('aria-hidden', 'true');
        this.root.append(raster);
        raster.append(this.capture);

        const ctx = raster.getContext('2d', { alpha: true });

        if (!canDrawElement(ctx)) {
            raster.remove();
            throw new Error('polyfill drawElementImage unavailable');
        }

        this.raster = raster;
        this.rasterCtx = ctx;
        raster.addEventListener('paint', this.onPaint);
    }

    private teardownPaintSource() {
        this.canvas.removeEventListener('paint', this.onPaint);
        this.raster?.removeEventListener('paint', this.onPaint);
    }

    private requestPaint() {
        const target = (this.raster ?? this.canvas) as PaintableCanvas;

        target.requestPaint?.();
    }

    private initGl(gl: ElementGl): boolean {
        try {
            const glassProgram = link(
                gl,
                compile(gl, gl.VERTEX_SHADER, VERT),
                compile(gl, gl.FRAGMENT_SHADER, GLASS_FRAG),
            );
            const blurProgram = link(
                gl,
                compile(gl, gl.VERTEX_SHADER, VERT),
                compile(gl, gl.FRAGMENT_SHADER, BLUR_FRAG),
            );
            const texture = makeTexture(gl);
            const mapTexture = makeTexture(gl);
            const blurFbo = gl.createFramebuffer();
            const vao = gl.createVertexArray();
            const buffer = gl.createBuffer();

            if (!vao || !buffer || !blurFbo) {
                throw new Error('buffer');
            }

            gl.bindVertexArray(vao);
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
            gl.enableVertexAttribArray(0);
            gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
            gl.bindVertexArray(null);

            this.glassProgram = glassProgram;
            this.blurProgram = blurProgram;
            this.texture = texture;
            this.mapTexture = mapTexture;
            this.blurFbo = blurFbo;
            this.vao = vao;
            this.buffer = buffer;
            this.glassUniforms = {
                backdrop: uniform(gl, glassProgram, 'uBackdrop'),
                map: uniform(gl, glassProgram, 'uMap'),
                resolution: uniform(gl, glassProgram, 'uResolution'),
                pageSize: uniform(gl, glassProgram, 'uPageSize'),
                scroll: uniform(gl, glassProgram, 'uScroll'),
                texScale: uniform(gl, glassProgram, 'uTexScale'),
                box: uniform(gl, glassProgram, 'uBox'),
                scale: uniform(gl, glassProgram, 'uScale'),
                lodBias: uniform(gl, glassProgram, 'uLodBias'),
            };
            this.blurUniforms = {
                input: uniform(gl, blurProgram, 'uInput'),
                resolution: uniform(gl, blurProgram, 'uResolution'),
                texel: uniform(gl, blurProgram, 'uTexel'),
                offset: uniform(gl, blurProgram, 'uOffset'),
                mode: uniform(gl, blurProgram, 'uMode'),
            };

            return true;
        } catch {
            return false;
        }
    }

    private bindButton(el: HTMLButtonElement): LensButton {
        return {
            el,
            labelOff: el.dataset.labelOff || el.textContent?.trim() || 'Continue',
            labelOn: el.dataset.labelOn || 'Added',
            scaleX: spring(1),
            scaleY: spring(1),
            pressed: false,
            hovered: false,
            appliedScaleX: 1,
            appliedScaleY: 1,
        };
    }

    private buttonOf(target: EventTarget | null): LensButton | undefined {
        return this.buttons.find((btn) => btn.el === target);
    }

    private enableCss() {
        this.cssMode = true;
        this.html = false;
        this.canvas.hidden = true;

        for (const btn of this.buttons) {
            btn.el.classList.add('lg-button--css');
        }

        this.teardownPaintSource();
        this.capture.remove();
        this.raster?.remove();
        this.raster = null;
        this.rasterCtx = null;
    }

    private initTweakPane() {
        const redraw = () => {
            this.mapKey = '';
            this.requestFrame();
        };
        const reblur = () => {
            this.blurPage();
            this.requestFrame();
        };

        this.tweakPane = new Pane({ title: 'Parameters', expanded: matchMedia('(min-width: 1200px)').matches });

        const optics = this.tweakPane.addFolder({ title: 'Optics' });

        optics.addBinding(this.params, 'refraction', { min: 0, max: 80, step: 0.5 }).on('change', redraw);
        optics.addBinding(this.params, 'bezel', { min: 0.02, max: 1, step: 0.01 }).on('change', redraw);
        optics.addBinding(this.params, 'curvature', { min: 1, max: 8, step: 0.1 }).on('change', redraw);
        optics.addBinding(this.params, 'ior', { min: 1, max: 2.4, step: 0.01 }).on('change', redraw);
        optics.addBinding(this.params, 'chroma', { min: 0, max: 0.5, step: 0.01 }).on('change', redraw);
        optics.addBinding(this.params, 'blur', { min: 0, max: 12, step: 0.1 }).on('change', reblur);
        optics.addBinding(this.params, 'specular', { min: 0, max: 1, step: 0.01 }).on('change', redraw);
        optics.addBinding(this.params, 'specularWidth', { min: 0.5, max: 12, step: 0.1 }).on('change', redraw);
        optics.addBinding(this.params, 'lightAngle', { min: -180, max: 180, step: 1 }).on('change', redraw);
        optics.addBinding(this.params, 'invert').on('change', redraw);
    }

    private bindInput() {
        for (const btn of this.buttons) {
            btn.el.addEventListener('pointerenter', this.onEnter);
            btn.el.addEventListener('pointerleave', this.onLeave);
            btn.el.addEventListener('pointerdown', this.onDown);
            btn.el.addEventListener('click', this.onClick);
            btn.el.addEventListener('keydown', this.onKeyDown);
            btn.el.addEventListener('keyup', this.onKeyUp);
            btn.el.addEventListener('blur', this.onBlur);
        }

        window.addEventListener('pointerup', this.onUp);
        window.addEventListener('pointercancel', this.onUp);
        this.root.addEventListener('scroll', this.onScroll, { passive: true });

        const supportsDpc =
            typeof ResizeObserverEntry !== 'undefined' && 'devicePixelContentBoxSize' in ResizeObserverEntry.prototype;

        this.rootObserver.observe(this.canvas, supportsDpc ? { box: 'device-pixel-content-box' } : {});
        this.buttonObserver.observe(this.bar);
    }

    private unbindInput() {
        for (const btn of this.buttons) {
            btn.el.removeEventListener('pointerenter', this.onEnter);
            btn.el.removeEventListener('pointerleave', this.onLeave);
            btn.el.removeEventListener('pointerdown', this.onDown);
            btn.el.removeEventListener('click', this.onClick);
            btn.el.removeEventListener('keydown', this.onKeyDown);
            btn.el.removeEventListener('keyup', this.onKeyUp);
            btn.el.removeEventListener('blur', this.onBlur);
        }

        window.removeEventListener('pointerup', this.onUp);
        window.removeEventListener('pointercancel', this.onUp);
        this.root.removeEventListener('scroll', this.onScroll);
    }

    private readonly onScroll = () => {
        this.scrollY = this.root.scrollTop;
        // Full (downsampled) capture stays static — scroll is uScroll only.
        this.requestFrame();
    };

    private readonly onEnter = (event: PointerEvent) => {
        const btn = this.buttonOf(event.currentTarget);

        if (!btn) {
            return;
        }

        btn.hovered = true;
        this.updateScaleTarget(btn);
    };

    private readonly onLeave = (event: PointerEvent) => {
        const btn = this.buttonOf(event.currentTarget);

        if (!btn) {
            return;
        }

        btn.hovered = false;
        this.updateScaleTarget(btn);
    };

    private readonly onDown = (event: PointerEvent) => {
        const btn = this.buttonOf(event.currentTarget);

        if (!btn) {
            return;
        }

        btn.pressed = true;
        this.updateScaleTarget(btn);
    };

    private readonly onUp = () => {
        let any = false;

        for (const btn of this.buttons) {
            if (!btn.pressed) {
                continue;
            }

            btn.pressed = false;
            this.updateScaleTarget(btn);
            any = true;
        }

        if (!any) {
            return;
        }
    };

    private readonly onClick = (event: MouseEvent) => {
        const btn = this.buttonOf(event.currentTarget);

        if (!btn) {
            return;
        }

        const on = btn.el.getAttribute('aria-pressed') === 'true';

        btn.el.setAttribute('aria-pressed', on ? 'false' : 'true');
        btn.el.textContent = on ? btn.labelOff : btn.labelOn;
    };

    private readonly onKeyDown = (event: KeyboardEvent) => {
        if (event.key !== ' ' && event.key !== 'Enter') {
            return;
        }

        const btn = this.buttonOf(event.currentTarget);

        if (!btn) {
            return;
        }

        btn.pressed = true;
        this.updateScaleTarget(btn);
    };

    private readonly onKeyUp = (event: KeyboardEvent) => {
        if (event.key !== ' ' && event.key !== 'Enter') {
            return;
        }

        const btn = this.buttonOf(event.currentTarget);

        if (!btn) {
            return;
        }

        btn.pressed = false;
        this.updateScaleTarget(btn);
    };

    private readonly onBlur = (event: FocusEvent) => {
        const btn = this.buttonOf(event.currentTarget);

        if (!btn) {
            return;
        }

        btn.pressed = false;
        btn.hovered = false;
        this.updateScaleTarget(btn);
    };

    private updateScaleTarget(btn: LensButton) {
        if (btn.pressed) {
            btn.scaleX.target = 1.045;
            btn.scaleY.target = 0.9;
        } else if (btn.hovered) {
            btn.scaleX.target = 1.02;
            btn.scaleY.target = 1.02;
        } else {
            btn.scaleX.target = 1;
            btn.scaleY.target = 1;
        }

        this.requestFrame();
    }

    private onRootResize(entry?: ResizeObserverEntry) {
        const width = this.root.clientWidth;
        const height = this.root.clientHeight;

        if (width < 2 || height < 2) {
            return;
        }

        const dpc = entry?.devicePixelContentBoxSize?.[0];
        const bitmapW = dpc
            ? dpc.inlineSize
            : Math.max(1, Math.round(width * Math.min(window.devicePixelRatio || 1, 2)));
        const bitmapH = dpc
            ? dpc.blockSize
            : Math.max(1, Math.round(height * Math.min(window.devicePixelRatio || 1, 2)));

        const pageMinH = height * PAGE_LENGTH;
        const prevW = this.live.style.width;
        const prevMinH = this.live.style.minHeight;
        const pageSizeChanged = prevW !== `${width}px` || prevMinH !== `${pageMinH}px`;
        const bufferChanged = !this.cssMode && (this.canvas.width !== bitmapW || this.canvas.height !== bitmapH);

        if (bufferChanged) {
            this.canvas.width = bitmapW;
            this.canvas.height = bitmapH;
        }

        this.canvas.style.inset = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.dpr = this.canvas.width / Math.max(this.canvas.clientWidth, 1);

        if (pageSizeChanged) {
            for (const el of [this.live, this.capture]) {
                el.style.width = `${width}px`;
                el.style.minHeight = `${pageMinH}px`;
            }
        }

        if (this.raster) {
            const pageH = Math.max(this.capture.offsetHeight, pageMinH);
            const rw = Math.max(1, Math.round(width * this.dpr * CAPTURE_ZOOM));
            const rh = Math.max(1, Math.round(pageH * this.dpr * CAPTURE_ZOOM));

            this.raster.style.width = `${width}px`;
            this.raster.style.height = `${pageH}px`;

            if (this.raster.width !== rw || this.raster.height !== rh) {
                this.raster.width = rw;
                this.raster.height = rh;
            }
        }

        // Full HTML→GPU + blur only when page CSS size changes — not every buffer tick.
        if (pageSizeChanged) {
            this.texW = 0;
            this.texH = 0;
            this.requestPaint();
        }

        if (pageSizeChanged || bufferChanged) {
            this.glassLayout = null;
            this.requestFrame();
        }
    }

    private readonly onPaint = () => {
        if (this.disposed || !this.html || this.cssMode) {
            return;
        }

        this.uploadDomTexture();
        this.draw();
    };

    private ensureTexture(gl: ElementGl, w: number, h: number) {
        if (!this.texture || w < 2 || h < 2) {
            return;
        }

        if (this.texW === w && this.texH === h) {
            return;
        }

        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        this.texW = w;
        this.texH = h;
        this.pageTexW = w;
        this.pageTexH = h;
        this.blurMipW = [];
        this.blurMipH = [];
    }

    private ensureBlurMips(gl: WebGL2RenderingContext, fullW: number, fullH: number, levels: number) {
        while (this.blurMips.length < levels) {
            this.blurMips.push(makeTexture(gl));
        }

        for (let i = 0; i < levels; i++) {
            const w = Math.max(2, fullW >> i);
            const h = Math.max(2, fullH >> i);

            if (this.blurMipW[i] === w && this.blurMipH[i] === h) {
                continue;
            }

            gl.bindTexture(gl.TEXTURE_2D, this.blurMips[i]);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
            this.blurMipW[i] = w;
            this.blurMipH[i] = h;
        }
    }

    private blurPass(
        gl: WebGL2RenderingContext,
        uniforms: BlurUniforms,
        read: WebGLTexture,
        write: WebGLTexture,
        outW: number,
        outH: number,
        inW: number,
        inH: number,
        mode: number,
        offset: number,
    ) {
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, write, 0);
        gl.viewport(0, 0, outW, outH);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, read);
        gl.uniform2f(uniforms.resolution, outW, outH);
        gl.uniform2f(uniforms.texel, 1 / inW, 1 / inH);
        gl.uniform1f(uniforms.offset, offset);
        gl.uniform1f(uniforms.mode, mode);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    /** Dual-Kawase pyramid on paint/slider. */
    private blurPage() {
        const gl = this.gl;
        const uniforms = this.blurUniforms;

        if (
            !gl ||
            !uniforms ||
            !this.blurProgram ||
            !this.vao ||
            !this.texture ||
            !this.blurFbo ||
            this.texW < 2 ||
            this.cssMode
        ) {
            this.useBlur = false;

            return;
        }

        if (this.params.blur < 0.05) {
            this.useBlur = false;

            return;
        }

        const downs = Math.max(1, Math.min(BLUR_MAX_LEVELS - 1, Math.round(this.params.blur * 0.7) + 1));
        const levels = downs + 1;
        const offset = 1 + this.params.blur * 0.25;

        this.ensureBlurMips(gl, this.texW, this.texH, levels);
        this.useBlur = true;

        gl.disable(gl.BLEND);
        gl.disable(gl.SCISSOR_TEST);
        gl.disable(gl.DEPTH_TEST);
        gl.bindVertexArray(this.vao);
        gl.useProgram(this.blurProgram);
        gl.uniform1i(uniforms.input, 0);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.blurFbo);

        let read: WebGLTexture = this.texture;
        let inW = this.texW;
        let inH = this.texH;

        for (let i = 1; i < levels; i++) {
            const outW = this.blurMipW[i];
            const outH = this.blurMipH[i];

            this.blurPass(gl, uniforms, read, this.blurMips[i], outW, outH, inW, inH, 0, offset);
            read = this.blurMips[i];
            inW = outW;
            inH = outH;
        }

        for (let i = levels - 2; i >= 0; i--) {
            const outW = this.blurMipW[i];
            const outH = this.blurMipH[i];

            this.blurPass(gl, uniforms, read, this.blurMips[i], outW, outH, inW, inH, 1, offset);
            read = this.blurMips[i];
            inW = outW;
            inH = outH;
        }

        gl.bindTexture(gl.TEXTURE_2D, this.blurMips[0]);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.generateMipmap(gl.TEXTURE_2D);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindVertexArray(null);
        gl.enable(gl.BLEND);
    }

    private uploadDomTexture() {
        const gl = this.gl;

        if (!gl || !this.texture || this.capture.offsetWidth < 2) {
            return;
        }

        const pageCssW = Math.max(this.capture.offsetWidth, 1);
        const pageCssH = Math.max(this.capture.offsetHeight, 1);
        const canvasScaleX = this.canvas.width / Math.max(this.canvas.clientWidth, 1);
        const canvasScaleY = this.canvas.height / Math.max(this.canvas.clientHeight, 1);

        if (this.polyfilled && this.raster && this.rasterCtx) {
            const w = this.raster.width;
            const h = this.raster.height;

            if (w < 2 || h < 2) {
                return;
            }

            this.rasterCtx.clearRect(0, 0, w, h);
            this.rasterCtx.drawElementImage(this.capture, 0, 0, w, h);
            this.texScaleX = w / pageCssW / canvasScaleX;
            this.texScaleY = h / pageCssH / canvasScaleY;
            this.ensureTexture(gl, w, h);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.raster);
            this.blurPage();

            return;
        }

        const natural = this.canvas.getElementImageDefaultSize?.(this.capture);
        const w = Math.max(2, Math.ceil(natural?.width ?? this.capture.offsetWidth * this.dpr));
        const h = Math.max(2, Math.ceil(natural?.height ?? this.capture.offsetHeight * this.dpr));

        this.texScaleX = w / pageCssW / canvasScaleX;
        this.texScaleY = h / pageCssH / canvasScaleY;
        this.ensureTexture(gl, w, h);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texElementSubImage2D(gl.TEXTURE_2D, 0, 0, 0, this.capture);
        this.blurPage();
    }

    private requestFrame() {
        if (this.disposed || this.running) {
            return;
        }

        this.running = true;
        this.last = performance.now();
        this.raf = requestAnimationFrame(this.tick);
    }

    private readonly tick = (now: number) => {
        if (this.disposed) {
            return;
        }

        const dt = Math.min(0.032, (now - this.last) / 1000);

        this.last = now;
        const moving = this.step(dt);

        this.applyScale();
        this.draw();

        if (moving) {
            this.raf = requestAnimationFrame(this.tick);
        } else {
            this.running = false;
        }
    };

    private step(dt: number): boolean {
        let moving = false;

        for (const btn of this.buttons) {
            if (this.reduceMotion) {
                btn.scaleX.value = btn.scaleX.target;
                btn.scaleY.value = btn.scaleY.target;
                btn.scaleX.velocity = 0;
                btn.scaleY.velocity = 0;
                continue;
            }

            moving = stepSpring(btn.scaleX, dt, 24, 0.78) || moving;
            moving = stepSpring(btn.scaleY, dt, 24, 0.78) || moving;
        }

        return moving;
    }

    private applyScale() {
        for (const btn of this.buttons) {
            const x = btn.scaleX.value;
            const y = btn.scaleY.value;

            if (Math.abs(x - btn.appliedScaleX) < 0.0001 && Math.abs(y - btn.appliedScaleY) < 0.0001) {
                continue;
            }

            btn.appliedScaleX = x;
            btn.appliedScaleY = y;
            btn.el.style.transform = `scale(${x}, ${y})`;
            this.glassLayout = null;
        }
    }

    private rebuildGlassLayout() {
        const canvasRect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / canvasRect.width;
        const scaleY = this.canvas.height / canvasRect.height;
        const boxes = this.buttons.map((btn) => {
            const buttonRect = btn.el.getBoundingClientRect();
            const radius = readCssPx(getComputedStyle(btn.el).borderTopLeftRadius, 0);
            const boxX = (buttonRect.left - canvasRect.left) * scaleX;
            const boxTop = (buttonRect.top - canvasRect.top) * scaleY;
            const boxW = buttonRect.width * scaleX;
            const boxH = buttonRect.height * scaleY;
            const boxY = this.canvas.height - boxTop - boxH;
            const mapW = Math.max(2, Math.round(boxW));
            const mapH = Math.max(2, Math.round(boxH));

            return {
                boxX,
                boxY,
                boxW,
                boxH,
                scissorX: Math.max(0, Math.floor(boxX)),
                scissorY: Math.max(0, Math.floor(boxY)),
                scissorW: Math.min(this.canvas.width - Math.max(0, Math.floor(boxX)), Math.ceil(boxW)),
                scissorH: Math.min(this.canvas.height - Math.max(0, Math.floor(boxY)), Math.ceil(boxH)),
                cssW: buttonRect.width,
                cssH: buttonRect.height,
                mapW,
                mapH,
                radius,
            };
        });

        this.glassLayout = { scaleX, scaleY, boxes };
    }

    private draw() {
        const gl = this.gl;
        const glass = this.glassUniforms;

        if (
            !gl ||
            !glass ||
            !this.glassProgram ||
            !this.vao ||
            !this.texture ||
            !this.mapTexture ||
            this.cssMode ||
            this.canvas.width < 2 ||
            this.texW < 2
        ) {
            return;
        }

        if (!this.glassLayout) {
            this.rebuildGlassLayout();
        }

        const layout = this.glassLayout;

        if (!layout) {
            return;
        }

        const bend = 2 * this.params.refraction * layout.scaleY;
        const scrollTex = this.scrollY * (this.pageTexH / Math.max(this.capture.offsetHeight, 1));
        const backdrop = this.useBlur && this.blurMips[0] ? this.blurMips[0] : this.texture;

        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.SCISSOR_TEST);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.bindVertexArray(this.vao);
        gl.useProgram(this.glassProgram);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, backdrop);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.mapTexture);
        gl.uniform1i(glass.backdrop, 0);
        gl.uniform1i(glass.map, 1);
        gl.uniform2f(glass.resolution, this.canvas.width, this.canvas.height);
        gl.uniform2f(glass.pageSize, this.pageTexW, this.pageTexH);
        gl.uniform1f(glass.scroll, scrollTex);
        gl.uniform2f(glass.texScale, this.texScaleX, this.texScaleY);
        gl.uniform3f(glass.scale, bend, bend * (1 + this.params.chroma / 2), bend * (1 + this.params.chroma));
        gl.uniform1f(glass.lodBias, this.useBlur ? Math.min(1.25, 0.35 + this.params.blur * 0.08) : 0);
        gl.enable(gl.SCISSOR_TEST);

        for (const box of layout.boxes) {
            this.uploadMap(gl, box.cssW, box.cssH, box.mapW, box.mapH, box.radius);
            gl.activeTexture(gl.TEXTURE1);
            gl.bindTexture(gl.TEXTURE_2D, this.mapTexture);
            gl.scissor(box.scissorX, box.scissorY, Math.max(0, box.scissorW), Math.max(0, box.scissorH));
            gl.uniform4f(glass.box, box.boxX, box.boxY, box.boxW, box.boxH);
            gl.drawArrays(gl.TRIANGLES, 0, 3);
        }

        gl.disable(gl.SCISSOR_TEST);
    }

    private uploadMap(
        gl: WebGL2RenderingContext,
        cssW: number,
        cssH: number,
        mapW: number,
        mapH: number,
        radius: number,
    ) {
        if (!this.mapTexture || mapW < 2 || mapH < 2) {
            return;
        }

        const optics = this.params;
        const key = [
            mapW,
            mapH,
            cssW.toFixed(1),
            cssH.toFixed(1),
            radius.toFixed(2),
            optics.bezel,
            optics.curvature,
            optics.ior,
            optics.specular,
            optics.specularWidth,
            optics.lightAngle,
            optics.invert,
        ].join(':');

        if (key === this.mapKey) {
            return;
        }

        const pixels = new Uint8ClampedArray(mapW * mapH * 4);

        fillLensMap(pixels, mapW, mapH, cssW, cssH, radius, this.params);
        this.mapKey = key;
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.bindTexture(gl.TEXTURE_2D, this.mapTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, mapW, mapH, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    }

    private deleteGl() {
        const gl = this.gl;

        if (!gl) {
            return;
        }

        if (this.glassProgram) {
            gl.deleteProgram(this.glassProgram);
        }

        if (this.blurProgram) {
            gl.deleteProgram(this.blurProgram);
        }

        if (this.texture) {
            gl.deleteTexture(this.texture);
        }

        if (this.mapTexture) {
            gl.deleteTexture(this.mapTexture);
        }

        for (const tex of this.blurMips) {
            gl.deleteTexture(tex);
        }

        this.blurMips = [];
        this.blurMipW = [];
        this.blurMipH = [];

        if (this.blurFbo) {
            gl.deleteFramebuffer(this.blurFbo);
        }

        if (this.buffer) {
            gl.deleteBuffer(this.buffer);
        }

        if (this.vao) {
            gl.deleteVertexArray(this.vao);
        }
    }
}
