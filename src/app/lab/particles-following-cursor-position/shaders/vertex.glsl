attribute vec3 aColor;
attribute float aSize;
attribute float aKoef;

uniform float uTime;
uniform vec2 uPointer;
uniform float uSpeed;

varying float vDistance;
varying vec3 vColor;
varying float vKoef;

#include "../../../../../lygia/generative/curl.glsl"

void main() {
    vKoef = aKoef;

    vec3 uTarget = vec3(uPointer, 0.);
    vec4 data = vec4(position, 0.);
    vec3 pos = data.rgb;
    float newDist = distance(uTarget, pos);
    pos += uTarget;
    pos += curl(pos + uTime * uSpeed * aKoef * 0.1) * 0.3;
    pos += curl(pos + uTime * uSpeed * 0.1) * 0.3;

    vColor = aColor;
    // vec4 data = texture(uPositions, position.xy);
    vDistance = newDist;

    vec4 modelPosition = modelMatrix * vec4(pos, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition;

    gl_PointSize = 100.0;
    gl_PointSize *= aSize;
    gl_PointSize *= (1.0 / -viewPosition.z);
}
