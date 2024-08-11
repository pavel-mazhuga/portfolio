#pragma glslify: smoothMod = require('../../../glsl-utils/smoothmod.glsl')
#pragma glslify: remap = require('../../../glsl-utils/remap.glsl')

varying vec3 vNormal;
varying vec3 vViewDirection;
varying vec3 vEyeVector;
varying float vPattern;

uniform float uTime;
uniform float uSpeed;
uniform float uNoiseStrength;
uniform float uDisplacementStrength;
uniform float uFractAmount;
uniform float[2] uRemapPower;

#include "../../../../../lygia/generative/snoise.glsl"

void main() {
    vNormal = normal;

    vec3 coords = normal;
    coords.y -= uTime * 0.05 * uSpeed;
    coords += snoise3(coords) * uNoiseStrength;

    float pattern = remap(smoothMod(coords.y * uFractAmount, 1., 1.5), uRemapPower[0], uRemapPower[1], 0., 1.);
    vPattern = pattern;

    vec3 newPos = position + normal * pattern * uDisplacementStrength;
    vec3 viewDirection = normalize(newPos - cameraPosition);
    vViewDirection = viewDirection;

    vec4 worldPos = modelMatrix * vec4(newPos, 1.);

    gl_Position = projectionMatrix * viewMatrix * worldPos;
}
