import { SLIDE_WAVE_DURATION_MS } from '../constants';

export function smoothDelay01(t: number): number {
    const x = Math.min(1, Math.max(0, t));

    return x * x * (3 - 2 * x);
}

export function secondsToReachHalfFlip(flipSpeed: number, deltaSec: number): number {
    const f = Math.max(flipSpeed, 0.01);
    const d = Math.min(Math.max(deltaSec, 1 / 240), 0.1);
    const target = Math.PI;
    const half = Math.PI / 2;
    let current = 0;
    let t = 0;
    const maxT = 5;

    while (current < half - 0.005 && t < maxT) {
        const angleDiff = target - current;

        current += angleDiff * d * f;
        t += d;
    }

    return t;
}

export function slideWaveSettleDurationMs(flipSpeed: number): number {
    const swapDelayMs = Math.round(secondsToReachHalfFlip(flipSpeed, 1 / 60) * 1000);

    return SLIDE_WAVE_DURATION_MS + swapDelayMs;
}
