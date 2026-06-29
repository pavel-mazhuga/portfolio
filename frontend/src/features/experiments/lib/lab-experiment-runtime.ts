import { TransitionBeforePreparationEvent } from 'astro:transitions/client';
import { isLabDetailPage } from '@/shared/lib/router';

type LabExperienceInstance = {
    destroy(): void;
};

type DemoConstructor = new (canvas: HTMLCanvasElement) => LabExperienceInstance;

const demoLoaders = import.meta.glob<{ default: DemoConstructor }>(['../*/Demo.ts', '../*/demo.ts']);

const slugToDemoLoader = new Map<string, () => Promise<{ default: DemoConstructor }>>();

for (const [relativePath, loader] of Object.entries(demoLoaders)) {
    const match = relativePath.match(/^\.\.\/([^/]+)\/[Dd]emo\.ts$/);

    if (match) {
        slugToDemoLoader.set(match[1], loader);
    }
}

let active: LabExperienceInstance | null = null;
let mountGeneration = 0;
let pendingFromPathname = '';
let pendingToPathname = '';

function getLabExperimentSlug(pathname: string): string | null {
    const trimmed = pathname.replace(/\/+$/, '') || '/';
    const match = trimmed.match(/\/lab\/([^/]+)$/);

    return match?.[1] ?? null;
}

function destroyActive(): void {
    active?.destroy();
    active = null;
}

function hideExperimentCanvases(): void {
    document.querySelectorAll<HTMLElement>('.js-experiment-canvas-wrapper').forEach((el) => {
        el.style.opacity = '0';
        el.style.visibility = 'hidden';
    });
}

async function tryMount(slug: string, canvas: HTMLCanvasElement, generation: number): Promise<void> {
    let demo: LabExperienceInstance | null = null;
    const loadDemo = slugToDemoLoader.get(slug);

    if (!loadDemo) {
        return;
    }

    const { default: Demo } = await loadDemo();

    demo = new Demo(canvas);

    if (generation !== mountGeneration) {
        demo?.destroy();

        return;
    }

    active = demo;
}

document.addEventListener('astro:before-preparation', (event) => {
    if (!(event instanceof TransitionBeforePreparationEvent)) {
        return;
    }

    pendingFromPathname = event.from.pathname;
    pendingToPathname = event.to.pathname;
});

document.addEventListener('astro:after-preparation', () => {
    if (!isLabDetailPage(pendingFromPathname) || isLabDetailPage(pendingToPathname)) {
        return;
    }

    destroyActive();
    hideExperimentCanvases();
});

document.addEventListener('astro:before-swap', () => {
    mountGeneration += 1;
    destroyActive();
});

function mountLabExperimentFromLocation(): void {
    destroyActive();

    const slug = getLabExperimentSlug(window.location.pathname);

    if (!slug) {
        return;
    }

    const canvas = document.querySelector<HTMLCanvasElement>('canvas.js-experiment-canvas');

    if (!canvas) {
        return;
    }

    const generation = mountGeneration;

    void tryMount(slug, canvas, generation);
}

document.addEventListener('astro:page-load', mountLabExperimentFromLocation);
