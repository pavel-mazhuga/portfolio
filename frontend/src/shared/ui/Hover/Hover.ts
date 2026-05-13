import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';

import { taskScheduler } from '@/shared/lib/scheduler';

gsap.registerPlugin(SplitText);

const ROOT_SELECTOR = '.js-hover';
const TRANSITION_PERSIST_SELECTOR = '[data-astro-transition-persist]';
const CONTAINER_SELECTOR = '.js-hover-container';
const TEXT_SELECTOR = '.js-hover-text';
const CLIP_CLASS = 'hover__clip';
const TRACK_CLASS = 'hover__track';
const ROW_CLASS = 'hover__row';

const DURATION = 0.45;
const STAGGER_EACH = 0.02;
const EASE = 'power2.out';

type Instance = {
    split: SplitText;
    tracks: HTMLElement[];
    onEnter: () => void;
    onLeave: () => void;
    ariaLabelAdded: boolean;
    triggerEl: HTMLElement;
};

const registry = new Map<HTMLElement, Instance>();

const prefersReducedMotion = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function wrapInRollTracks(nodes: Element[]): HTMLElement[] {
    const tracks: HTMLElement[] = [];

    for (const node of nodes) {
        if (!(node instanceof HTMLElement)) {
            continue;
        }

        const charText = node.textContent ?? '';

        node.textContent = '';

        const clip = document.createElement('span');

        clip.className = CLIP_CLASS;

        const track = document.createElement('span');

        track.className = TRACK_CLASS;

        const rowA = document.createElement('span');

        rowA.className = ROW_CLASS;
        rowA.textContent = charText;

        const rowB = document.createElement('span');

        rowB.className = ROW_CLASS;
        rowB.setAttribute('aria-hidden', 'true');
        rowB.textContent = charText;

        track.append(rowA, rowB);
        clip.append(track);
        node.append(clip);
        tracks.push(track);
    }

    return tracks;
}

const noop = () => {};

function setupHover(triggerEl: HTMLElement, tracks: HTMLElement[], reducedMotion: boolean) {
    if (reducedMotion || tracks.length === 0) {
        return { onEnter: noop, onLeave: noop };
    }

    const stagger = { each: STAGGER_EACH, from: 'center' as const };

    const onEnter = () => {
        gsap.killTweensOf(tracks);
        gsap.to(tracks, {
            yPercent: -50,
            duration: DURATION,
            ease: EASE,
            stagger,
            overwrite: 'auto',
        });
    };

    const onLeave = () => {
        gsap.killTweensOf(tracks);
        gsap.to(tracks, {
            yPercent: 0,
            duration: DURATION,
            ease: EASE,
            stagger,
            overwrite: 'auto',
        });
    };

    triggerEl.addEventListener('mouseenter', onEnter);
    triggerEl.addEventListener('mouseleave', onLeave);

    return { onEnter, onLeave };
}

async function init() {
    const roots = document.querySelectorAll<HTMLElement>(ROOT_SELECTOR);

    for (let i = 0; i < roots.length; i++) {
        const root = roots[i]!;

        if (i > 0) {
            await taskScheduler.yield();
        }

        if (registry.has(root)) {
            continue;
        }

        const textEl = root.querySelector(TEXT_SELECTOR);

        if (!(textEl instanceof HTMLElement)) {
            continue;
        }

        const reducedMotion = prefersReducedMotion();

        const plainLabel = (textEl.textContent ?? '').trim();
        const interactiveRoot = root.matches('a[href]') || root.matches('button:not([disabled])');
        const ariaLabelAdded = interactiveRoot && !root.getAttribute('aria-label') && plainLabel.length > 0;

        if (ariaLabelAdded) {
            root.setAttribute('aria-label', plainLabel);
        }

        const split = SplitText.create(textEl, {
            type: 'chars,words',
            charsClass: 'hover__char',
            wordsClass: 'hover__word',
            aria: 'none',
            tag: 'span',
        });

        const tracks = wrapInRollTracks(split.chars);
        const triggerEl = root.closest<HTMLElement>(CONTAINER_SELECTOR) ?? root;
        const handlers = setupHover(triggerEl, tracks, reducedMotion);

        registry.set(root, {
            split,
            tracks,
            onEnter: handlers.onEnter,
            onLeave: handlers.onLeave,
            ariaLabelAdded,
            triggerEl,
        });
    }
}

function destroy() {
    for (const [root, instance] of [...registry.entries()]) {
        if (root.closest(TRANSITION_PERSIST_SELECTOR)) {
            continue;
        }

        gsap.killTweensOf(instance.tracks);
        instance.triggerEl.removeEventListener('mouseenter', instance.onEnter);
        instance.triggerEl.removeEventListener('mouseleave', instance.onLeave);
        instance.split.revert();

        if (instance.ariaLabelAdded) {
            root.removeAttribute('aria-label');
        }
        registry.delete(root);
    }
}

export default { init, destroy };
