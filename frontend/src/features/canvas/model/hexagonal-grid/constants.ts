export const HEX_RADIUS = 0.7;
export const HEX_HEIGHT = 0.2;

const HEX_HEIGHT_PER_RADIUS = HEX_HEIGHT / HEX_RADIUS;

export const HEX_RADIUS_MAX_FRACTION_OF_HALF_MIN_EXTENT = 0.19;

export function effectiveHexDimensions(
    viewportWidth: number,
    viewportHeight: number,
): {
    radius: number;
    height: number;
} {
    const halfMin = Math.min(viewportWidth, viewportHeight) * 0.5;
    const maxRadius = halfMin * HEX_RADIUS_MAX_FRACTION_OF_HALF_MIN_EXTENT;
    const radius = Math.min(HEX_RADIUS, Math.max(0.05, maxRadius));

    return { radius, height: HEX_HEIGHT_PER_RADIUS * radius };
}

export const GRID_SPACING_FACTOR = 1.025;
export const CENTRAL_REGION_WIDTH_RATIO = 0.7;

export function clampedViewportAspectForCentralRegion(viewportWidth: number, viewportHeight: number): number {
    const ar = viewportWidth / viewportHeight;

    return viewportWidth >= viewportHeight ? Math.min(ar, 16 / 9) : Math.max(ar, 9 / 16);
}

export function centralRegionDimensions(
    viewportWidth: number,
    viewportHeight: number,
): { width: number; height: number } {
    const maxW = viewportWidth * CENTRAL_REGION_WIDTH_RATIO;
    const maxH = viewportHeight * CENTRAL_REGION_WIDTH_RATIO;
    const contentAspect = clampedViewportAspectForCentralRegion(viewportWidth, viewportHeight);
    let width = maxW;
    let height = width / contentAspect;

    if (height > maxH) {
        height = maxH;
        width = height * contentAspect;
    }

    return { width, height };
}
export const GRID_INTRO_SCALE_DURATION = 1.5;
export const GRID_INTRO_STAGGER = 1;
export const SLIDE_WAVE_DURATION_MS = 800;
export const SLIDE_CENTER_PHYSICS_MS = 100;
export const SLIDE_SYNTH_IMPULSE = 0.7;

export const CURSOR_IMPULSE_STRENGTH_K_FINE = 1;
export const CURSOR_IMPULSE_STRENGTH_K_COARSE = 0.32;
export const CURSOR_IMPULSE_RADIUS_K_FINE = 0.5;
export const CURSOR_IMPULSE_RADIUS_K_COARSE = 0.4;
export const CURSOR_REPEL_DISPLACEMENT_SCALE_FINE = 1;
export const CURSOR_REPEL_DISPLACEMENT_SCALE_COARSE = 0.2;
export const COARSE_POINTER_CURSOR_RADIUS_DIVISOR = 3;
export const COARSE_POINTER_CURSOR_STRENGTH_DIVISOR = 3;
export const COARSE_POINTER_PRESS_DECAY_TAU_SEC = 0.14;
