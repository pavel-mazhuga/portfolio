#pragma glslify: smoothMod = require('../../../glsl-utils/smoothmod.glsl')

attribute vec4 tangent;

varying float vPattern;

uniform float uTime;
uniform float uSpeed;
uniform float uNoiseStrength;
uniform float uDisplacementStrength;
uniform float uFractAmount;

#include "../../../../../lygia/generative/cnoise.glsl"

float getDisplacement(vec3 position) {
    vec3 pos = position;
    pos.y -= uTime * 0.05 * uSpeed;
    pos += cnoise(pos * 1.65) * uNoiseStrength;

    return smoothMod(pos.y * uFractAmount, 1., 1.5) * uDisplacementStrength;
}

void main() {
    vec3 biTangent = cross(csm_Normal, tangent.xyz);
    float shift = 0.01;
    vec3 posA = csm_Position + tangent.xyz * shift;
    vec3 posB = csm_Position + biTangent * shift;

    float pattern = getDisplacement(csm_Position);
    vPattern = pattern;

    csm_Position += csm_Normal * pattern;
    posA += csm_Normal * getDisplacement(posA);
    posB += csm_Normal * getDisplacement(posB);

    vec3 toA = normalize(posA - csm_Position);
    vec3 toB = normalize(posB - csm_Position);

    csm_Normal = normalize(cross(toA, toB));
}
