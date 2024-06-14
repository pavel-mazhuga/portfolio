#pragma glslify: smoothMod = require('../../../glsl-utils/smoothmod.glsl')
#pragma glslify: remap = require('../../../glsl-utils/remap.glsl')

attribute vec4 tangent;

varying float vPattern;

uniform float uTime;
uniform float uSpeed;
uniform float uNoiseStrength;
uniform float uDisplacementStrength;
uniform float uFractAmount;
uniform float[2] uRemapPower;

#include "../../../../../lygia/generative/snoise.glsl"

float getDisplacement(vec3 position) {
    position.y -= uTime * 0.05 * uSpeed;
    position += snoise3(position) * uNoiseStrength;

    return remap(smoothMod(position.y * uFractAmount, 1., 1.5), uRemapPower[0], uRemapPower[1], 0., 1.) * uDisplacementStrength;
}

void main() {
    vec3 biTangent = cross(normal, tangent.xyz);
    float shift = 0.01;
    vec3 posA = csm_Position + tangent.xyz * shift;
    vec3 posB = csm_Position + biTangent * shift;

    float pattern = getDisplacement(csm_Position);
    vPattern = pattern;

    csm_Position += normal * pattern;
    posA += normal * getDisplacement(posA);
    posB += normal * getDisplacement(posB);

    vec3 toA = normalize(posA - csm_Position);
    vec3 toB = normalize(posB - csm_Position);

    csm_Normal = normalize(cross(toA, toB));
}
