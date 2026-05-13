import gsap from 'gsap';
import { onOutsideClickAction } from '@/shared/lib/on-outside-click-action';

const ODOMETER_DURATION_S = 0.45;
const ODOMETER_EASE = 'power2.out';

const CLS = {
    col: 'projects-counter-odometer__col',
    viewport: 'projects-counter-odometer__viewport',
    track: 'projects-counter-odometer__track',
    cell: 'projects-counter-odometer__cell',
} as const;

let slides: HTMLElement[] = [];
let prevButton: HTMLElement | null = null;
let nextButton: HTMLElement | null = null;
let counterCurrent: HTMLElement | null = null;
let currentIndex = 0;
let infoButtons: HTMLElement[] = [];
let infoCloseButtons: HTMLElement[] = [];
let disposeProjectInfoOutsideClick: (() => void) | null = null;
let odometerTracks: HTMLElement[] | null = null;
let rowHeightPx = 0;
let odometerResizeObserver: ResizeObserver | null = null;
let odometerResizeRafId = 0;

function tearDownProjectInfoOutsideClick() {
    disposeProjectInfoOutsideClick?.();
    disposeProjectInfoOutsideClick = null;
}

function closeAllProjectInfo() {
    tearDownProjectInfoOutsideClick();
    // eslint-disable-next-line custom/no-class-selector-without-js-prefix
    document.querySelectorAll('.js-projects-list-item-info.is-visible').forEach((el) => {
        el.classList.remove('is-visible');
    });
    document.querySelectorAll('.js-projects-list-item-info-button[aria-expanded="true"]').forEach((btn) => {
        btn.setAttribute('aria-expanded', 'false');
    });
}

function handleInfoButtonClick(event: Event) {
    const button = event.currentTarget as HTMLElement;
    const index = button.dataset.index;

    if (index === undefined) {
        return;
    }

    const info = document.querySelector<HTMLElement>(`.js-projects-list-item-info[data-index="${CSS.escape(index)}"]`);

    if (!info) {
        return;
    }

    const willOpen = !info.classList.contains('is-visible');

    closeAllProjectInfo();

    if (willOpen) {
        info.classList.add('is-visible');
        button.setAttribute('aria-expanded', 'true');
        disposeProjectInfoOutsideClick = onOutsideClickAction([info, button], closeAllProjectInfo);
    }
}

function handleInfoCloseClick() {
    closeAllProjectInfo();
}

function getSlideIndexFromDom(slideElements: HTMLElement[]): number {
    const idx = slideElements.findIndex((el) => !el.classList.contains('is-hidden'));

    return idx === -1 ? 0 : idx;
}

function parseTotal(root: HTMLElement): number {
    const raw = root.dataset.total;

    if (!raw) {
        return 0;
    }

    const n = Number.parseInt(raw, 10);

    return Number.isFinite(n) ? n : 0;
}

function setCounterAria(root: HTMLElement, displayValue: number, total: number) {
    root.setAttribute('aria-label', `Current project ${displayValue} of ${total}`);
}

function buildOdometerDom(root: HTMLElement): HTMLElement[] | null {
    root.textContent = '';
    const tracks: HTMLElement[] = [];

    for (let i = 0; i < 2; i += 1) {
        const col = document.createElement('div');

        col.className = CLS.col;
        col.setAttribute('aria-hidden', 'true');
        const viewport = document.createElement('div');

        viewport.className = CLS.viewport;
        const track = document.createElement('div');

        track.className = CLS.track;

        for (let d = 0; d < 10; d += 1) {
            const cell = document.createElement('div');

            cell.className = CLS.cell;
            cell.textContent = String(d);
            track.appendChild(cell);
        }

        viewport.appendChild(track);
        col.appendChild(viewport);
        root.appendChild(col);
        tracks.push(track);
    }

    return tracks;
}

function measureRowHeight(track: HTMLElement): number {
    const firstCell = track.querySelector<HTMLElement>(`.${CLS.cell}`);

    if (!firstCell) {
        return 0;
    }

    return firstCell.getBoundingClientRect().height;
}

function setTracksY(tracks: HTMLElement[], value1ToN: number, height: number) {
    const n = Math.max(0, value1ToN);
    const tens = Math.floor(n / 10);
    const units = n % 10;

    gsap.set(tracks[0], { y: -tens * height });
    gsap.set(tracks[1], { y: -units * height });
}

function refreshOdometerAfterResize() {
    if (!odometerTracks || !counterCurrent) {
        return;
    }

    const h = measureRowHeight(odometerTracks[0]);

    if (h <= 0) {
        return;
    }

    rowHeightPx = h;
    gsap.killTweensOf(odometerTracks);

    const displayValue = currentIndex + 1;

    setTracksY(odometerTracks, displayValue, rowHeightPx);
}

function scheduleOdometerResize() {
    cancelAnimationFrame(odometerResizeRafId);
    odometerResizeRafId = requestAnimationFrame(() => {
        odometerResizeRafId = 0;
        refreshOdometerAfterResize();
    });
}

function attachOdometerResizeObserver() {
    if (!counterCurrent || !odometerTracks || typeof ResizeObserver === 'undefined') {
        return;
    }

    odometerResizeObserver = new ResizeObserver(() => {
        scheduleOdometerResize();
    });

    odometerResizeObserver.observe(counterCurrent);

    window.addEventListener('resize', scheduleOdometerResize, { passive: true });
    window.addEventListener('orientationchange', scheduleOdometerResize);
}

function animateTracksTo(tracks: HTMLElement[], value1ToN: number, height: number) {
    const n = Math.max(0, value1ToN);
    const tens = Math.floor(n / 10);
    const units = n % 10;

    gsap.to(tracks[0], {
        y: -tens * height,
        duration: ODOMETER_DURATION_S,
        ease: ODOMETER_EASE,
    });

    gsap.to(tracks[1], {
        y: -units * height,
        duration: ODOMETER_DURATION_S,
        ease: ODOMETER_EASE,
    });
}

function mountOdometer(root: HTMLElement) {
    odometerTracks = buildOdometerDom(root);

    if (!odometerTracks) {
        return;
    }

    const align = () => {
        rowHeightPx = measureRowHeight(odometerTracks![0]);

        if (rowHeightPx <= 0) {
            return;
        }

        const displayValue = currentIndex + 1;

        setTracksY(odometerTracks!, displayValue, rowHeightPx);
        setCounterAria(root, displayValue, parseTotal(root));
    };

    requestAnimationFrame(() => {
        align();
        attachOdometerResizeObserver();
    });
}

function updateOdometerDisplay() {
    if (!counterCurrent || !odometerTracks) {
        return;
    }

    if (rowHeightPx <= 0) {
        rowHeightPx = measureRowHeight(odometerTracks[0]);
    }

    if (rowHeightPx <= 0) {
        return;
    }

    const displayValue = currentIndex + 1;

    animateTracksTo(odometerTracks, displayValue, rowHeightPx);
    setCounterAria(counterCurrent, displayValue, parseTotal(counterCurrent));
}

function changeSlideToPrev() {
    closeAllProjectInfo();
    slides[currentIndex].classList.add('is-hidden');
    currentIndex = gsap.utils.wrap(0, slides.length, currentIndex - 1);
    slides[currentIndex].classList.remove('is-hidden');

    updateOdometerDisplay();

    document.dispatchEvent(new CustomEvent('projects-prev'));
}

function changeSlideToNext() {
    closeAllProjectInfo();
    slides[currentIndex].classList.add('is-hidden');
    currentIndex = gsap.utils.wrap(0, slides.length, currentIndex + 1);
    slides[currentIndex].classList.remove('is-hidden');

    updateOdometerDisplay();

    document.dispatchEvent(new CustomEvent('projects-next'));
}

function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowLeft') {
        changeSlideToPrev();
    } else if (event.key === 'ArrowRight') {
        changeSlideToNext();
    }
}

function init() {
    slides = Array.from(document.querySelectorAll('.js-projects-list-item'));
    prevButton = document.querySelector('.js-projects-prev-button');
    nextButton = document.querySelector('.js-projects-next-button');
    counterCurrent = document.querySelector('.js-projects-counter-current');

    if (slides.length > 0) {
        currentIndex = getSlideIndexFromDom(slides);
    }

    if (counterCurrent) {
        mountOdometer(counterCurrent);
    }

    if (prevButton) {
        prevButton.addEventListener('click', changeSlideToPrev);
    }

    if (nextButton) {
        nextButton.addEventListener('click', changeSlideToNext);
    }

    document.addEventListener('keydown', handleKeyDown);

    infoButtons = Array.from(document.querySelectorAll<HTMLElement>('.js-projects-list-item-info-button'));
    infoCloseButtons = Array.from(document.querySelectorAll<HTMLElement>('.js-projects-list-item-info-close'));

    infoButtons.forEach((btn) => {
        btn.addEventListener('click', handleInfoButtonClick);
    });
    infoCloseButtons.forEach((btn) => {
        btn.addEventListener('click', handleInfoCloseClick);
    });
}

function destroy() {
    tearDownProjectInfoOutsideClick();

    odometerResizeObserver?.disconnect();
    odometerResizeObserver = null;
    cancelAnimationFrame(odometerResizeRafId);
    odometerResizeRafId = 0;

    window.removeEventListener('resize', scheduleOdometerResize);
    window.removeEventListener('orientationchange', scheduleOdometerResize);

    if (odometerTracks) {
        gsap.killTweensOf(odometerTracks);
        odometerTracks = null;
    }

    rowHeightPx = 0;
    slides = [];
    currentIndex = 0;

    if (prevButton) {
        prevButton.removeEventListener('click', changeSlideToPrev);
        prevButton = null;
    }

    if (nextButton) {
        nextButton.removeEventListener('click', changeSlideToNext);
        nextButton = null;
    }

    counterCurrent = null;

    document.removeEventListener('keydown', handleKeyDown);

    infoButtons.forEach((btn) => {
        btn.removeEventListener('click', handleInfoButtonClick);
    });
    infoCloseButtons.forEach((btn) => {
        btn.removeEventListener('click', handleInfoCloseClick);
    });
    infoButtons = [];
    infoCloseButtons = [];
}

export default { init, destroy };
