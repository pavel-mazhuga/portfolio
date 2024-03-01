#pragma glslify: cnoise3 = require(glsl-noise/classic/3d);
#pragma glslify: curlNoise = require(../../../glsl-utils/noise/curl-noise);

uniform sampler2D uPositionsA;
uniform sampler2D uPositionsB;
uniform float uProgress;
uniform float uTime;

varying vec2 vUv;

void main() {
    vec3 posA = texture2D(uPositionsA, vUv).rgb;
    float ampA = length(posA);
    posA += cnoise3(posA + uTime * 0.1) * 0.1 * ampA;

    vec3 posB = texture2D(uPositionsB, vUv).rgb;
    float ampB = sin(posB.x);
    posB += cnoise3(posB + uTime * 0.1) * 0.1 * ampB;

    gl_FragColor = vec4(mix(posA, posB, uProgress), 1.0);
}
