#pragma glslify: cnoise3 = require('glsl-noise/classic/3d')

uniform float uTime;
uniform vec3 uColor;

varying vec2 vUv;
varying vec3 vPosition;

void main() {
    vec2 uv = vUv;
    float noise = cnoise3(vec3(vPosition.x * 50. + uTime * 0.2 + sin(uv.x) + sin(uv.y)));
    vec3 color = vec3(noise);
    color *= uColor;

    gl_FragColor = vec4(color, 1.);
}
