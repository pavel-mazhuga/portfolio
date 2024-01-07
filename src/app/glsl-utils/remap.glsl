float remap(float value, float in_min, float in_max, float out_min, float out_max) {
    float mapped = ((value - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
    return clamp(mapped, out_min, out_max);
}

#pragma glslify: export(remap)
