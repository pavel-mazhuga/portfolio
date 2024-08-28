#pragma glslify: palette = require(../../../glsl-utils/palette.glsl)

uniform float uTime;
varying vec3 vColor;
varying float vDistance;

vec3 experimentPalette(float t) {
    vec3 a = vec3(0.6);
    vec3 b = vec3(0.6);
    vec3 c = vec3(0.95, 0.67, 0.9);
    vec3 d = vec3(0.05, 0.15, 0.27);

    return palette(t, a, b, c, d);
}

void main() {
    vec2 uv = gl_PointCoord;
    float distanceToCenter = length(uv - 0.5);
    vec3 color = vColor;
    float alpha = 0.05 / distanceToCenter - 0.1;
    color = experimentPalette(color.z) * experimentPalette(vDistance * 0.3);

    gl_FragColor = vec4(color, alpha);
    // gl_FragColor = vec4(vec3(smoothstep(0.5, 1., vDistance)), alpha);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
