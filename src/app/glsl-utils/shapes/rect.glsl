float rect(vec2 pt, vec2 size, vec2 center) {
    vec2 p = pt - center;
    vec2 halfSize = size * 0.5;
    float horz = step(-halfSize.x, p.x) - step(halfSize.x, p.x);
    float vert = step(-halfSize.y, p.y) - step(halfSize.y, p.y);
    return horz * vert;
}

#pragma glslify: export(rect);