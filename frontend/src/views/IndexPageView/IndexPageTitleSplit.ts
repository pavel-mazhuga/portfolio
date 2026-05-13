import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(SplitText);

const ROOT_SELECTOR = '.js-index-title';
const LINE_SELECTOR = '.js-index-title-line';
const WORD_SELECTOR = '.index-page__title-word';
const VT_LINE_PREFIX = 'index-title-line';
const TRANSITION_PERSIST_SELECTOR = '[data-astro-transition-persist]';

const splits: SplitText[] = [];

const prefersReducedMotion = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function revealWords(root: HTMLElement) {
    requestAnimationFrame(() => {
        root.querySelectorAll<HTMLElement>(WORD_SELECTOR).forEach((el) => {
            el.classList.add('is-visible');
        });
    });
}

function prepareExit() {
    if (prefersReducedMotion()) {
        return;
    }

    const root = document.querySelector<HTMLElement>(ROOT_SELECTOR);

    if (!root) {
        return;
    }

    root.querySelectorAll<HTMLElement>(WORD_SELECTOR).forEach((el, index) => {
        el.style.viewTransitionName = `${VT_LINE_PREFIX}-${index}`;
    });
}

function init() {
    const root = document.querySelector<HTMLElement>(ROOT_SELECTOR);

    if (!root || root.querySelector(WORD_SELECTOR)) {
        return;
    }

    if (prefersReducedMotion()) {
        return;
    }

    const lineEls = root.querySelectorAll<HTMLElement>(LINE_SELECTOR);

    for (const lineEl of lineEls) {
        const split = SplitText.create(lineEl, {
            type: 'words',
            wordsClass: 'index-page__title-word',
            aria: 'none',
            tag: 'span',
        });

        splits.push(split);
    }

    revealWords(root);
}

function destroy() {
    const next: SplitText[] = [];

    for (const split of splits) {
        const keep = split.elements.some((el) => el.closest(TRANSITION_PERSIST_SELECTOR));

        if (keep) {
            next.push(split);
            continue;
        }

        const connected = split.elements.some((el) => el.isConnected);

        if (connected) {
            for (const word of split.words) {
                if (word instanceof HTMLElement) {
                    word.classList.remove('is-visible');
                }
            }

            split.revert();
        }
    }

    splits.length = 0;
    splits.push(...next);
}

export default { init, destroy, prepareExit };
