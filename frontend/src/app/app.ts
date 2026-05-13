import { isTransitionBeforePreparationEvent } from 'astro:transitions/client';
import '@/features/experiments/lib/lab-experiment-runtime';
import calculateScrollbarWidth from '@/shared/lib/dom/calculate-scrollbar-width';
import vhMobileFix from '@/shared/lib/dom/vh-mobile-fix';
import { isLabDetailPage, isLabIndexPage } from '@/shared/lib/router';

const CLIP_EL_SELECTOR = '.clip-container__el';
const CLIP_VT_PREFIX = 'clip-line';
const VT_LAB_FADE_ATTR = 'data-vt-lab-fade';

const prefersReducedMotion = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function isClipVtOnceEl(el: HTMLElement): boolean {
    return el.closest('.clip-container')?.classList.contains('clip-container--view-transition-once') ?? false;
}

function prepareClipVtExit() {
    if (prefersReducedMotion()) {
        return;
    }

    if (document.documentElement.hasAttribute(VT_LAB_FADE_ATTR)) {
        return;
    }

    document.querySelectorAll<HTMLElement>(CLIP_EL_SELECTOR).forEach((el, index) => {
        if (isClipVtOnceEl(el)) {
            return;
        }

        el.style.viewTransitionName = `${CLIP_VT_PREFIX}-${index}`;
    });
}

function revealClipContainers() {
    requestAnimationFrame(() => {
        document.querySelectorAll<HTMLElement>(CLIP_EL_SELECTOR).forEach((el) => {
            el.classList.add('is-visible');
        });
    });
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
    calculateScrollbarWidth();
    vhMobileFix();
    revealClipContainers();
});

document.addEventListener('astro:before-preparation', (event) => {
    if (!isTransitionBeforePreparationEvent(event)) {
        return;
    }

    const { from, to } = event;
    const labListToDetail = isLabIndexPage(from.pathname) && isLabDetailPage(to.pathname);
    const detailToLabList = isLabDetailPage(from.pathname) && isLabIndexPage(to.pathname);

    if (labListToDetail || detailToLabList) {
        document.documentElement.setAttribute(VT_LAB_FADE_ATTR, '');
    }
});

document.addEventListener('astro:after-swap', () => {
    document.documentElement.removeAttribute(VT_LAB_FADE_ATTR);
});

document.addEventListener('astro:after-preparation', prepareClipVtExit);
document.addEventListener('astro:before-swap', resetClipContainers);
