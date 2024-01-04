float circle(vec2 pt, vec2 center, float radius) {
    vec2 p = pt - center;
    return 1. - step(radius, length(p));
}

#pragma glslify: export(circle);
