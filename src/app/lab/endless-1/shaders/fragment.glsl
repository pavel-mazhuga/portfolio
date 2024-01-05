#pragma glslify: palette = require(../../../glsl-utils/palette.glsl)

uniform float uTime;
uniform vec2 uResolution;

vec3 experimentPalette(float t) {
    vec3 a = vec3(0.5);
    vec3 b = vec3(0.5);
    vec3 c = vec3(1.);
    vec3 d = vec3(0.263, 0.416, 0.557);

    return palette(t, a, b, c, d);
}

void main() {
    vec2 uv = gl_FragCoord.xy / uResolution - 1.;
    uv.x *= uResolution.x / uResolution.y;
    vec2 uv0 = uv;

    uv = fract(uv * 2.) - 0.5;

    vec3 col = experimentPalette(length(uv0 * 0.9) + uTime * 0.4);

    float d = length(uv);
    d = sin(d * 8. + uTime) / 8.;
    d = abs(d);
    d = 0.02 / d;
    col *= d;

    gl_FragColor = vec4(col, 1.);
    #include <colorspace_fragment>
}
