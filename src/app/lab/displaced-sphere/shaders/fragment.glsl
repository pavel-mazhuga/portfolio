#pragma glslify: cnoise3 = require('glsl-noise/classic/3d')
#pragma glslify: palette = require(../../../glsl-utils/palette.glsl)

uniform float uTime;

varying float vDisplacement;
varying vec2 vUv;
varying vec3 vPosition;

vec3 experimentPalette(float t) {
    vec3 a = vec3(0.5);
    vec3 b = vec3(0.5);
    vec3 c = vec3(0.95, 0.65, 0.3);
    vec3 d = vec3(0.0, 0.15, 0.17);

    return palette(t, a, b, c, d);
}

void main() {
    vec2 uv = vUv;
    vec3 color = vec3((0.1 + length(vPosition.y * vDisplacement)) * 0.8) + vec3(pow(length(vDisplacement), 1.2)) * 7.;
    color = experimentPalette(color.z) * 1.2;

    gl_FragColor = vec4(color, 1.);
    #include <colorspace_fragment>
}
