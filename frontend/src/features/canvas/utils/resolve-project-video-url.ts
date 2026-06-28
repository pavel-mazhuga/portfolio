import type { VideoShape } from '@/shared/model/types';

function toAbsoluteUrl(src: string): string {
    if (/^https?:\/\//i.test(src)) {
        return src;
    }

    const base = typeof document !== 'undefined' ? document.baseURI : undefined;

    if (base) {
        try {
            return new URL(src, base).href;
        } catch {
            return src;
        }
    }

    return src;
}

function mediaQueryMatches(query: string): boolean {
    if (typeof matchMedia !== 'function') {
        return false;
    }

    return matchMedia(query).matches;
}

/** Mirrors `<video><source media>` selection when `matchMedia` exists; otherwise picks the default (no-media) source. */
export function resolveProjectVideoUrlFromSources(sources: VideoShape): string {
    if (typeof matchMedia === 'function') {
        for (const source of sources) {
            if (!source.media || mediaQueryMatches(source.media)) {
                return toAbsoluteUrl(source.src);
            }
        }
    }

    const defaultSource = sources.find((source) => !source.media);
    const fallback = defaultSource ?? sources.at(-1);

    if (!fallback) {
        return '';
    }

    return toAbsoluteUrl(fallback.src);
}
