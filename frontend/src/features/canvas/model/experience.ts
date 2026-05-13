import debounce from 'lodash.debounce';
import { ProxyWorld } from './ProxyWorld';
import type { IWorld } from './types';

/** iOS/WebKit often leaves currentSrc empty until load; list markup uses <source> only. */
function resolveProjectListVideoUrl(video: HTMLVideoElement): string {
    const current = video.currentSrc?.trim();

    if (current) {
        return current;
    }
    const direct = video.getAttribute('src')?.trim();

    if (direct) {
        try {
            return new URL(direct, document.baseURI).href;
        } catch {
            return direct;
        }
    }
    const fromSource = video.querySelector('source[src]')?.getAttribute('src')?.trim();

    if (fromSource) {
        try {
            return new URL(fromSource, document.baseURI).href;
        } catch {
            return fromSource;
        }
    }

    return '';
}

const SPACE_POINTER_RADIUS_MUL = 2;

function isTypingTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) {
        return false;
    }

    const tag = target.tagName;

    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
        return true;
    }

    return target.isContentEditable;
}

class Experience {
    canvasParent: HTMLElement | null;
    world?: IWorld;
    #routeWired = false;
    #spacePressActive = false;
    prevTime = 0;
    isHoverMq = matchMedia('(any-hover: hover), (hover: hover) and (pointer: fine)');

    constructor(private readonly canvas: HTMLCanvasElement) {
        this.onWindowResize = this.onWindowResize.bind(this);
        this.debouncedOnWindowResize = this.debouncedOnWindowResize.bind(this);
        this.onPointermove = this.onPointermove.bind(this);
        this.onPointerdown = this.onPointerdown.bind(this);
        this.onPointerup = this.onPointerup.bind(this);
        this.onKeydown = this.onKeydown.bind(this);
        this.onKeyup = this.onKeyup.bind(this);

        this.canvasParent = canvas.parentElement;
        const isDebug = new URLSearchParams(window.location.search).has('debug');

        this.world = new ProxyWorld(
            {
                canvas,
                dpr: this.dpr,
                width: canvas.offsetWidth,
                height: canvas.offsetHeight,
                isDebug,
                useCoarsePointer: matchMedia('(pointer: coarse)').matches,
            },
            isDebug,
            () => this.#onWorldReady(),
        );

        this.#initEvents();
    }

    #onWorldReady() {
        if (this.#routeWired) {
            return;
        }
        this.#routeWired = true;
        document.addEventListener('astro:page-load', this.#onPageLoad);
        document.addEventListener('projects-prev', this.#onPrev);
        document.addEventListener('projects-next', this.#onNext);
        this.#syncRouteFromDom();
    }

    #onPageLoad = () => {
        this.#syncRouteFromDom();
    };

    #onPrev = () => {
        this.world?.prevSlide();
    };

    #onNext = () => {
        this.world?.nextSlide();
    };

    #syncRouteFromDom() {
        const isProjectsPage = window.location.pathname.includes('/projects');
        const videoUrls = isProjectsPage
            ? Array.from(document.querySelectorAll<HTMLVideoElement>('.js-projects-list-item__video')).map(
                  resolveProjectListVideoUrl,
              )
            : [];

        this.world?.applyRouteState({ isProjectsPage, videoUrls });
    }

    get dpr() {
        return Math.min(window.devicePixelRatio, 1.25);
    }

    private onWindowResize() {
        const width = this.canvasParent?.offsetWidth || 1;
        const height = this.canvasParent?.offsetHeight || 1;

        this.world?.onResize([width, height, this.dpr]);
    }

    debouncedOnWindowResize = debounce(this.onWindowResize, 100);

    private onPointermove(event: PointerEvent) {
        if (this.isHoverMq.matches || event.pointerType === 'touch') {
            this.world?.setPointerPosition(event.clientX, event.clientY);
        }
    }

    private onPointerdown(event: PointerEvent) {
        this.world?.setPointerPosition(event.clientX, event.clientY);
        this.world?.setPressed(true);
    }

    private onPointerup() {
        this.world?.setPressed(false);
    }

    private onKeydown(event: KeyboardEvent) {
        if (event.code !== 'Space' || event.repeat) {
            return;
        }

        if (isTypingTarget(event.target)) {
            return;
        }

        event.preventDefault();
        const rect = this.canvas.getBoundingClientRect();

        this.world?.setPointerPosition(rect.left + rect.width / 2, rect.top + rect.height / 2);
        this.world?.setPointerRadiusMul(SPACE_POINTER_RADIUS_MUL);
        this.world?.setPressed(true);
        this.#spacePressActive = true;
    }

    private onKeyup(event: KeyboardEvent) {
        if (event.code !== 'Space' || !this.#spacePressActive) {
            return;
        }

        this.world?.setPressed(false);
        this.world?.setPointerRadiusMul(1);
        this.#spacePressActive = false;
    }

    #initEvents() {
        window.addEventListener('resize', this.debouncedOnWindowResize);
        document.addEventListener('pointermove', this.onPointermove);
        document.addEventListener('pointerdown', this.onPointerdown);
        document.addEventListener('pointerup', this.onPointerup);
        document.addEventListener('pointercancel', this.onPointerup);
        document.addEventListener('keydown', this.onKeydown);
        document.addEventListener('keyup', this.onKeyup);
    }

    dispose() {
        if (this.#spacePressActive) {
            this.world?.setPressed(false);
            this.world?.setPointerRadiusMul(1);
            this.#spacePressActive = false;
        }

        window.removeEventListener('resize', this.debouncedOnWindowResize);
        document.removeEventListener('pointermove', this.onPointermove);
        document.removeEventListener('pointerdown', this.onPointerdown);
        document.removeEventListener('pointerup', this.onPointerup);
        document.removeEventListener('pointercancel', this.onPointerup);
        document.removeEventListener('keydown', this.onKeydown);
        document.removeEventListener('keyup', this.onKeyup);

        if (this.#routeWired) {
            document.removeEventListener('astro:page-load', this.#onPageLoad);
            document.removeEventListener('projects-prev', this.#onPrev);
            document.removeEventListener('projects-next', this.#onNext);
            this.#routeWired = false;
        }
        this.world?.dispose();
    }
}

export default Experience;
