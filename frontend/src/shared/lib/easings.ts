/**
 * Cubic
 */

export const easeInCubic = /* @__PURE__ */ (x: number): number => {
    return x * x * x;
};

export const easeOutCubic = /* @__PURE__ */ (x: number): number => {
    return 1 - Math.pow(1 - x, 3);
};

export const easeInOutCubic = /* @__PURE__ */ (x: number): number => {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

/**
 * Quart
 */

export const easeInQuart = /* @__PURE__ */ (x: number): number => {
    return x * x * x * x;
};

export const easeOutQuart = /* @__PURE__ */ (x: number): number => {
    return 1 - Math.pow(1 - x, 4);
};

export const easeInOutQuart = /* @__PURE__ */ (x: number): number => {
    return x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2;
};
