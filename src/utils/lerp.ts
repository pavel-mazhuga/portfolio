/**
 * Linear interpolation between two values.
 *
 * @param a The start value.
 * @param b The end value.
 * @param t A value between 0 and 1 indicating the proportion of `b` in the result.
 * @returns The interpolated value.
 */
export const lerp = /* @__PURE__ */ (a: number, b: number, t: number) => {
    return a + (b - a) * t;
};

/**
 * Framerate independent linear interpolation between two values.
 *
 * This is a variant of `lerp` that takes into account the time delta between
 * frames. It can be used to smoothly move between two values over a given
 * duration, even when the frame rate is not consistent.
 *
 * @param a The start value.
 * @param b The end value.
 * @param t A value between 0 and 1 indicating the proportion of `b` in the result.
 * @param [frameDelta] The time delta since the last frame.
 * @param [targetFps] The target frame rate, in frames per second. Defaults to 60.
 * @returns The interpolated value.
 */
export const flerp = /* @__PURE__ */ (a: number, b: number, t: number, frameDelta?: number, targetFps = 60) => {
    if (typeof frameDelta === 'undefined') {
        return lerp(a, b, t);
    }

    const relativeDelta = frameDelta / (1 / targetFps);
    const smoothing = 1 - t;

    return lerp(a, b, 1 - Math.pow(smoothing, relativeDelta));
};
