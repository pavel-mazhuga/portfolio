#pragma glslify: curlNoise = require(../../../glsl-utils/noise/curl-noise);

uniform sampler2D uPositions;
uniform float uTime;

varying vec2 vUv;

void main() {
    vec3 pos = texture(uPositions, vUv).rgb;
    pos.z += curlNoise(pos + uTime * 0.03).x * 0.3 * curlNoise(pos + uTime * 0.05).z * 0.3 * curlNoise(pos.xxx + uTime * 0.1).y * 0.3;

    gl_FragColor = vec4(pos, 1.0);
}
