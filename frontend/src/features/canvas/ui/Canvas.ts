import { isLabDetailPage } from '@/shared/lib/router';
import { Experience } from '../model';

let experience: Experience | null = null;
let isInitialized = false;
let suspendedForLab = false;

function init() {
    if (isInitialized) {
        return;
    }

    if (isLabDetailPage(window.location.pathname)) {
        return;
    }

    const canvas = document.querySelector<HTMLCanvasElement>('canvas.js-canvas');

    if (canvas) {
        experience = new Experience(canvas);
        isInitialized = true;
        suspendedForLab = false;
    }
}

function suspendForLab() {
    if (!isInitialized || !experience) {
        return;
    }

    experience.suspend();
    suspendedForLab = true;
}

function destroy() {
    if (!isInitialized || !experience) {
        isInitialized = false;
        experience = null;
        suspendedForLab = false;

        return;
    }

    experience.dispose();
    experience = null;
    isInitialized = false;
    suspendedForLab = false;
}

/** Persisted canvas island does not re-run its script after View Transitions;
 * re-init on each landing. */
function syncWithRoute() {
    if (isLabDetailPage(window.location.pathname)) {
        suspendForLab();

        return;
    }

    if (experience && suspendedForLab) {
        experience.resume();
        suspendedForLab = false;

        return;
    }

    init();
}

export default { init, destroy, syncWithRoute, suspendForLab };
