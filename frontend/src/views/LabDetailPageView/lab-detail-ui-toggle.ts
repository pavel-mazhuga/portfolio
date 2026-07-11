import { isLabDetailPage } from '@/shared/lib/router';

const UI_HIDDEN_CLASS = 'lab-detail-page--ui-hidden';

let uiHidden = false;

function isEditableTarget(target: EventTarget | null): boolean {
    return (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable)
    );
}

function setUiHidden(hidden: boolean): void {
    uiHidden = hidden;
    document.documentElement.classList.toggle(UI_HIDDEN_CLASS, hidden);
}

function onKeydown(event: KeyboardEvent): void {
    if (process.env.NODE_ENV !== 'development') {
        return;
    }

    if (!isLabDetailPage(window.location.pathname)) {
        return;
    }

    if (event.key !== 'p' && event.key !== 'P') {
        return;
    }

    if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
    }

    if (isEditableTarget(event.target)) {
        return;
    }

    event.preventDefault();
    setUiHidden(!uiHidden);
}

function syncWithRoute(): void {
    if (!isLabDetailPage(window.location.pathname) && uiHidden) {
        setUiHidden(false);
    }
}

document.addEventListener('keydown', onKeydown);
document.addEventListener('astro:page-load', syncWithRoute);
