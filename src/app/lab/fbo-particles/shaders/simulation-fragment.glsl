#pragma glslify: curlNoise = require('../../../glsl-utils/noise/curl-noise.glsl')

uniform sampler2D uPositions;
uniform float uTime;
uniform float uFrequency;
uniform float uSpeed;

varying vec2 vUv;

void main() {
    vec3 pos = texture2D(uPositions, vUv).rgb;
    pos = curlNoise(pos * uFrequency + uTime * uSpeed);

    gl_FragColor = vec4(pos, 1.0);
}
