import { isTransitionBeforePreparationEvent } from 'astro:transitions/client';
import '@/features/experiments/lib/lab-experiment-runtime';
import calculateScrollbarWidth from '@/shared/lib/dom/calculate-scrollbar-width';
import vhMobileFix from '@/shared/lib/dom/vh-mobile-fix';
import { isLabDetailPage, isLabIndexPage, isProjectsPage } from '@/shared/lib/router';
import { taskScheduler } from '@/shared/lib/scheduler';

const CLIP_EL_SELECTOR = '.clip-container__el';
const CLIP_VT_PREFIX = 'clip-line';
const VT_LAB_FADE_ATTR = 'data-vt-lab-fade';
const VT_LAB_VIEWPORT_ENTER_ATTR = 'data-vt-lab-viewport-enter';
const VT_PROJECTS_LEAVE_ATTR = 'data-vt-projects-leave';
const LAB_CARD_ITEM_SELECTOR = '.experiments-list__item';
const LAB_CARD_CLIP_SELECTOR = `${LAB_CARD_ITEM_SELECTOR} ${CLIP_EL_SELECTOR}`;
const PAGE_HEADER_CLIP_SELECTOR = '.page__header .clip-container__el';
const PROJECTS_ITEM_SELECTOR = '.js-projects-list-item';
const REVEAL_BATCH_SIZE = 24;

const prefersReducedMotion = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function isClipVtOnceEl(el: HTMLElement): boolean {
    return el.closest('.clip-container')?.classList.contains('clip-container--view-transition-once') ?? false;
}

function getViewportBounds(): { top: number; left: number; bottom: number; right: number } {
    const vv = window.visualViewport;

    if (vv) {
        return {
            top: vv.offsetTop,
            left: vv.offsetLeft,
            bottom: vv.offsetTop + vv.height,
            right: vv.offsetLeft + vv.width,
        };
    }

    return {
        top: 0,
        left: 0,
        bottom: window.innerHeight,
        right: window.innerWidth,
    };
}

function intersectsViewport(rect: DOMRect): boolean {
    const vp = getViewportBounds();

    return rect.bottom > vp.top && rect.top < vp.bottom && rect.right > vp.left && rect.left < vp.right;
}

function getLabCardItems(): HTMLElement[] {
    return Array.from(document.querySelectorAll<HTMLElement>(LAB_CARD_ITEM_SELECTOR));
}

function findFirstLabCardNotAbove(items: readonly HTMLElement[]): number {
    const vpTop = getViewportBounds().top;
    let lo = 0;
    let hi = items.length;

    while (lo < hi) {
        const mid = (lo + hi) >> 1;

        if (items[mid]!.getBoundingClientRect().bottom <= vpTop) {
            lo = mid + 1;
        } else {
            hi = mid;
        }
    }

    return lo;
}

function findLastLabCardNotBelow(items: readonly HTMLElement[]): number {
    const viewportBottom = getViewportBounds().bottom;
    let lo = 0;
    let hi = items.length - 1;
    let last = -1;

    while (lo <= hi) {
        const mid = (lo + hi) >> 1;

        if (items[mid]!.getBoundingClientRect().top < viewportBottom) {
            last = mid;
            lo = mid + 1;
        } else {
            hi = mid - 1;
        }
    }

    return last;
}

function forEachLabViewportCardClip(onClip: (el: HTMLElement) => void): void {
    const items = getLabCardItems();

    if (items.length === 0) {
        return;
    }

    const first = findFirstLabCardNotAbove(items);
    const last = findLastLabCardNotBelow(items);

    if (first > last) {
        return;
    }

    for (let i = first; i <= last; i++) {
        const item = items[i]!;

        if (!intersectsViewport(item.getBoundingClientRect())) {
            continue;
        }

        item.querySelectorAll<HTMLElement>(CLIP_EL_SELECTOR).forEach((el) => {
            if (isClipVtOnceEl(el)) {
                return;
            }

            onClip(el);
        });
    }
}

function prepareProjectsVisibleClipLeave(): void {
    let clipVtIndex = 0;

    document.querySelectorAll<HTMLElement>(PAGE_HEADER_CLIP_SELECTOR).forEach((el) => {
        if (isClipVtOnceEl(el)) {
            return;
        }

        el.style.viewTransitionName = `${CLIP_VT_PREFIX}-${clipVtIndex++}`;
    });

    document
        .querySelector<HTMLElement>(`${PROJECTS_ITEM_SELECTOR}:not(.is-hidden)`)
        ?.querySelectorAll<HTMLElement>(CLIP_EL_SELECTOR)
        .forEach((el) => {
            if (isClipVtOnceEl(el)) {
                return;
            }

            el.style.viewTransitionName = `${CLIP_VT_PREFIX}-${clipVtIndex++}`;
        });
}

async function addVisibleClassChunked(elements: readonly HTMLElement[]): Promise<void> {
    for (let i = 0; i < elements.length; i++) {
        elements[i]!.classList.add('is-visible');

        if (i % REVEAL_BATCH_SIZE === REVEAL_BATCH_SIZE - 1 && i < elements.length - 1) {
            await taskScheduler.yieldFrame();
        }
    }
}

function collectLabViewportClips(): HTMLElement[] {
    const clips: HTMLElement[] = [];

    forEachLabViewportCardClip((el) => {
        clips.push(el);
    });

    document.querySelectorAll<HTMLElement>(PAGE_HEADER_CLIP_SELECTOR).forEach((el) => {
        clips.push(el);
    });

    return clips;
}

function isInsideHiddenProjectSlide(el: HTMLElement): boolean {
    return Boolean(el.closest(`${PROJECTS_ITEM_SELECTOR}.is-hidden`));
}

async function revealProjectsClips(): Promise<void> {
    const visibleNow: HTMLElement[] = [];
    const hiddenSlides: HTMLElement[] = [];

    document.querySelectorAll<HTMLElement>(CLIP_EL_SELECTOR).forEach((el) => {
        if (isInsideHiddenProjectSlide(el)) {
            hiddenSlides.push(el);

            return;
        }

        visibleNow.push(el);
    });

    await addVisibleClassChunked(visibleNow);

    if (hiddenSlides.length > 0) {
        void addVisibleClassChunked(hiddenSlides);
    }
}

function prepareClipVtExit() {
    if (prefersReducedMotion()) {
        return;
    }

    if (document.documentElement.hasAttribute(VT_LAB_FADE_ATTR)) {
        return;
    }

    if (document.documentElement.hasAttribute(VT_PROJECTS_LEAVE_ATTR)) {
        prepareProjectsVisibleClipLeave();

        return;
    }

    let clipVtIndex = 0;

    document.querySelectorAll<HTMLElement>(CLIP_EL_SELECTOR).forEach((el) => {
        if (isClipVtOnceEl(el)) {
            return;
        }

        el.style.viewTransitionName = `${CLIP_VT_PREFIX}-${clipVtIndex++}`;
    });
}

function revealClipContainers() {
    const viewportEnter = document.documentElement.hasAttribute(VT_LAB_VIEWPORT_ENTER_ATTR);

    document.documentElement.removeAttribute(VT_LAB_VIEWPORT_ENTER_ATTR);

    void (async () => {
        await taskScheduler.yieldFrame();

        if (viewportEnter) {
            await addVisibleClassChunked(collectLabViewportClips());
            await addVisibleClassChunked(
                Array.from(document.querySelectorAll<HTMLElement>(LAB_CARD_CLIP_SELECTOR)).filter(
                    (el) => !el.classList.contains('is-visible'),
                ),
            );

            return;
        }

        if (isProjectsPage(window.location.pathname)) {
            await revealProjectsClips();

            return;
        }

        await addVisibleClassChunked(Array.from(document.querySelectorAll<HTMLElement>(CLIP_EL_SELECTOR)));
    })();
}

function resetClipContainers() {
    document.querySelectorAll<HTMLElement>(CLIP_EL_SELECTOR).forEach((el) => {
        if (isClipVtOnceEl(el)) {
            return;
        }

        el.classList.remove('is-visible');
    });
}

document.addEventListener('astro:page-load', () => {
    document.documentElement.classList.add('js-ready');

    taskScheduler.scheduleIdle(() => {
        calculateScrollbarWidth();
        vhMobileFix();
    });

    revealClipContainers();
});

document.addEventListener('astro:before-preparation', (event) => {
    if (!isTransitionBeforePreparationEvent(event)) {
        return;
    }

    const { from, to } = event;
    const labListToDetail = isLabIndexPage(from.pathname) && isLabDetailPage(to.pathname);
    const detailToLabList = isLabDetailPage(from.pathname) && isLabIndexPage(to.pathname);
    const leavingProjects = isProjectsPage(from.pathname) && !isProjectsPage(to.pathname);
    const enteringLabIndex =
        isLabIndexPage(to.pathname) && !isLabIndexPage(from.pathname) && !isLabDetailPage(from.pathname);

    if (labListToDetail || detailToLabList) {
        document.documentElement.setAttribute(VT_LAB_FADE_ATTR, '');
    } else if (leavingProjects) {
        document.documentElement.setAttribute(VT_PROJECTS_LEAVE_ATTR, '');
    } else if (enteringLabIndex) {
        document.documentElement.setAttribute(VT_LAB_VIEWPORT_ENTER_ATTR, '');
    }
});

document.addEventListener('astro:after-swap', () => {
    document.documentElement.removeAttribute(VT_LAB_FADE_ATTR);
    document.documentElement.removeAttribute(VT_PROJECTS_LEAVE_ATTR);
});

document.addEventListener('astro:after-preparation', prepareClipVtExit);
document.addEventListener('astro:before-swap', resetClipContainers);
