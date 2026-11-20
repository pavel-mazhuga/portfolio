import { install, type PolyfillStatus } from '@underglass/html-in-canvas-polyfill';

/** Pure CSS button chrome: `/lab/liquid-glass/?lgFallback` */
export function wantsCssFallback(): boolean {
    return new URLSearchParams(location.search).has('lgFallback');
}

/** Force polyfill even with native Chrome: `/lab/liquid-glass/?lgPolyfill` */
export function wantsForcedPolyfill(): boolean {
    return new URLSearchParams(location.search).has('lgPolyfill');
}

/**
 * Native → install() no-op. No native → polyfill. `?lgPolyfill` forces polyfill.
 * Call before `getContext('webgl2')`. Skip when `?lgFallback` (CSS last resort).
 */
export function ensureHtmlInCanvas(): PolyfillStatus | null {
    if (wantsCssFallback()) {
        return null;
    }

    return install({ force: wantsForcedPolyfill() });
}
