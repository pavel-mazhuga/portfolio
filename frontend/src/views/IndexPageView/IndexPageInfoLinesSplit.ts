import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';

import { taskScheduler } from '@/shared/lib/scheduler';

gsap.registerPlugin(SplitText);

const ROOT_SELECTOR = '.js-split-lines';
const LINE_CLASS = 'index-page__info-description__line';
const VT_LINE_PREFIX = 'index-desc-line';
const TRANSITION_PERSIST_SELECTOR = '[data-astro-transition-persist]';

const splits: SplitText[] = [];

const prefersReducedMotion = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function revealLines(lines: readonly HTMLElement[]) {
    const animate = () => {
        requestAnimationFrame(() => {
            for (const line of lines) {
                line.classList.add('is-visible');
            }
        });
    };

    if (document.fonts?.ready) {
        void document.fonts.ready.then(animate);
    } else {
        animate();
    }
}

function prepareExit() {
    if (prefersReducedMotion()) {
        return;
    }

    const root = document.querySelector<HTMLElement>(ROOT_SELECTOR);

    if (!root) {
        return;
    }

    const lineEls = root.querySelectorAll<HTMLElement>(`.${LINE_CLASS}`);

    lineEls.forEach((line, index) => {
        line.style.viewTransitionName = `${VT_LINE_PREFIX}-${index}`;
    });
}

async function init() {
    const roots = document.querySelectorAll<HTMLElement>(ROOT_SELECTOR);

    for (let i = 0; i < roots.length; i++) {
        const root = roots[i]!;

        if (i > 0) {
            await taskScheduler.yield();
        }

        if (prefersReducedMotion()) {
            continue;
        }

        const existing = root.querySelectorAll<HTMLElement>(`.${LINE_CLASS}`);

        if (existing.length > 0) {
            revealLines([...existing]);

            continue;
        }

        const runSplit = () => {
            if (!root.isConnected || root.querySelector(`.${LINE_CLASS}`)) {
                return;
            }

            const split = SplitText.create(root, {
                type: 'lines',
                linesClass: LINE_CLASS,
                aria: 'none',
                tag: 'span',
            });

            splits.push(split);
            revealLines(split.lines as HTMLElement[]);
        };

        if (document.fonts?.ready) {
            void document.fonts.ready.then(runSplit);
        } else {
            runSplit();
        }
    }
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
            for (const line of split.lines) {
                if (line instanceof HTMLElement) {
                    line.classList.remove('is-visible');
                }
            }
            split.revert();
        }
    }

    splits.length = 0;
    splits.push(...next);
}

export default { init, destroy, prepareExit };
