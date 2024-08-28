#include "../../../../../../lygia/generative/curl.glsl"

uniform sampler2D uPositions;
uniform float uTime;
uniform float uFrequency;
uniform float uSpeed;
uniform vec2 uPointer;
varying vec2 vUv;
varying float vKoef;

void main() {
    vec3 uTarget = vec3(uPointer, 0.);
    vec4 data = texture2D(uPositions, vUv);
    vec3 pos = data.rgb;
    float newDist = distance(uTarget, pos);
    pos += uTarget;
    pos += curl(pos + uTime * uSpeed * vKoef * 0.1) * 0.3;
    pos += curl(pos + uTime * uSpeed * 0.1) * 0.3;

    gl_FragColor = vec4(pos, newDist);
}
