import { isTransitionBeforePreparationEvent } from 'astro:transitions/client';
import debounce from 'lodash.debounce';
import { isProjectsPage } from '@/shared/lib/router';
import { ProxyWorld } from './ProxyWorld';
import type { IWorld } from './types';

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
    #lastIsProjectsPage?: boolean;
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
        const searchParams = new URLSearchParams(window.location.search);
        const isDebug = searchParams.has('debug');
        const skipWarmup = searchParams.has('noWarmup');

        this.world = new ProxyWorld(
            {
                canvas,
                dpr: this.dpr,
                width: canvas.offsetWidth,
                height: canvas.offsetHeight,
                isDebug,
                skipWarmup,
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
        document.addEventListener('astro:before-preparation', this.#onBeforePreparation);
        document.addEventListener('projects-prev', this.#onPrev);
        document.addEventListener('projects-next', this.#onNext);
        this.#wireRoutePrefetch();
        this.#syncRouteFromDom();
    }

    #onBeforePreparation = (event: Event) => {
        if (!isTransitionBeforePreparationEvent(event)) {
            return;
        }

        const { to } = event;

        if (isProjectsPage(to.pathname)) {
            this.world?.prefetchProjectsRoute?.();

            return;
        }

        if (to.pathname === '/' || to.pathname === '') {
            this.world?.prefetchHomeRoute?.();
        }
    };

    #wireRoutePrefetch() {
        const prefetchProjects = () => this.world?.prefetchProjectsRoute?.();
        const prefetchHome = () => this.world?.prefetchHomeRoute?.();
        const prewarmAll = () => this.world?.prewarmAllRoutes?.();

        document.querySelectorAll<HTMLAnchorElement>('a[href="/projects/"], a[href="/projects"]').forEach((link) => {
            link.addEventListener('pointerenter', prefetchProjects, { passive: true });
            link.addEventListener('focus', prefetchProjects);
        });

        document.querySelectorAll<HTMLAnchorElement>('a[href="/"]').forEach((link) => {
            link.addEventListener('pointerenter', prefetchHome, { passive: true });
            link.addEventListener('focus', prefetchHome);
        });

        document.querySelectorAll<HTMLAnchorElement>('a[href="/lab/"], a[href="/lab"]').forEach((link) => {
            link.addEventListener('pointerenter', prewarmAll, { passive: true });
            link.addEventListener('focus', prewarmAll);
        });
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
        const onProjectsPage = isProjectsPage(window.location.pathname);

        if (this.#lastIsProjectsPage === onProjectsPage) {
            return;
        }

        this.#lastIsProjectsPage = onProjectsPage;
        this.world?.applyRouteState({ isProjectsPage: onProjectsPage, videoUrls: [] });
    }

    suspend() {
        this.world?.suspend();
    }

    resume() {
        this.world?.resume();
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
            document.removeEventListener('astro:before-preparation', this.#onBeforePreparation);
            document.removeEventListener('projects-prev', this.#onPrev);
            document.removeEventListener('projects-next', this.#onNext);
            this.#routeWired = false;
        }

        this.world?.dispose();
    }
}

export default Experience;
