export function warmNeighborIndices(slotCount: number, activeIndex: number): Set<number> {
    const n = slotCount;

    if (n === 0) {
        return new Set();
    }

    const bounded = Math.min(Math.max(activeIndex, 0), n - 1);
    const prev = (bounded - 1 + n) % n;
    const next = (bounded + 1) % n;

    return new Set([prev, bounded, next]);
}

function assignSrcIfEmpty(video: HTMLVideoElement | undefined, url: string | undefined): void {
    if (!video || !url || video.src) {
        return;
    }

    video.src = url;
}

export function hydrateGridVideosNeighborFirst(
    videos: readonly HTMLVideoElement[],
    urls: readonly string[],
    activeIndex: number,
): void {
    const slotCount = Math.min(videos.length, urls.length);

    if (slotCount === 0) {
        return;
    }

    const warm = warmNeighborIndices(slotCount, activeIndex);

    warm.forEach((i) => {
        assignSrcIfEmpty(videos[i], urls[i]);
    });

    prefetchAdjacentGridVideos(videos, activeIndex);

    if (warm.size >= slotCount) {
        return;
    }

    const fillRemaining = () => {
        for (let i = 0; i < slotCount; i++) {
            if (warm.has(i)) {
                continue;
            }

            assignSrcIfEmpty(videos[i], urls[i]);
        }

        prefetchAdjacentGridVideos(videos, activeIndex);
    };

    setTimeout(fillRemaining, 0);
}

export function prefetchAdjacentGridVideos(videos: readonly HTMLVideoElement[], activeIndex: number): void {
    const slotCount = videos.length;

    if (slotCount === 0) {
        return;
    }

    const warm = warmNeighborIndices(slotCount, activeIndex);

    for (let i = 0; i < slotCount; i++) {
        const v = videos[i];

        if (!v?.src) {
            continue;
        }

        if (warm.has(i)) {
            v.preload = 'auto';

            const bounded = Math.min(Math.max(activeIndex, 0), slotCount - 1);

            if (i !== bounded && v.paused && v.readyState === HTMLMediaElement.HAVE_NOTHING) {
                v.load();
            }
        } else {
            v.preload = 'none';
        }
    }
}
