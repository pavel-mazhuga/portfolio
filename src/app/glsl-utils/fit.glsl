float fit(float unscaled, float originalMin, float originalMax, float minAllowed, float maxAllowed) {
    return (maxAllowed - minAllowed) * (unscaled - originalMin) / (originalMax - originalMin) + minAllowed;
}

#pragma glslify: export(fit)
