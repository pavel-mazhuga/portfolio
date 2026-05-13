export const clamp = /* @__PURE__ */ (value: number, min: number, max: number) => {
    // eslint-disable-next-line sonarjs/no-nested-conditional
    return min < max ? (value < min ? min : value > max ? max : value) : value < max ? max : value > min ? min : value;
};
