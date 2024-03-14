#pragma glslify: curlNoise = require(../../../glsl-utils/noise/curl-noise);

uniform sampler2D uPositions;
uniform float uTime;
uniform float uSpeed;
uniform vec2 uMouse;
uniform float uPower;
uniform float uDistribution;

varying vec2 vUv;

void main() {
    vec3 pos = texture2D(uPositions, vUv).rgb;

    vec2 v = pos.xy - uMouse;
    v *= 0.15;
    float dist = length(v);

    float amp = 0.1;
    pos += curlNoise(pos + uTime * uSpeed * (5. + (1. / dist * 0.1))) * (amp + smoothstep(1., 0.95, dist));
    vec3 direction = normalize(vec3(v, 0.));
    pos += direction * smoothstep(uDistribution, 0., dist) * uPower;

    gl_FragColor = vec4(pos, 1.0);
}
