#pragma glslify: cnoise3 = require('glsl-noise/classic/3d')
#pragma glslify: specular = require(../../../glsl-utils/specular.glsl)
#pragma glslify: palette = require(../../../glsl-utils/palette.glsl)

uniform float uTime;

varying float vDisplacement;
varying vec2 vUv;
varying vec3 vPosition;
varying float vPattern;
varying vec3 vNormal;
varying vec3 vEyeVector;

vec3 experimentPalette(float t) {
    vec3 a = vec3(0.5);
    vec3 b = vec3(0.5);
    vec3 c = vec3(1.);
    vec3 d = vec3(0.263, 0.416, 0.557);

    return palette(t, a, b, c, d);
}

void main() {
    vec2 uv = vUv;
    vec3 color = experimentPalette((1. + length(vPosition.xz)) * 0.5 + uTime * 0.01) - vec3(length(vDisplacement) * 2.);
    color = vec3((1. + length(vPosition.z)) * 0.5) - vec3(length(vDisplacement)) * 5.;
    color = experimentPalette(color.x);

    vec3 uLight = vec3(-1., 1., 1.);
    float uShininess = 20.;
    float uDiffuseness = 0.3;

    // Specular
    float specularLight = specular(uLight, vNormal, vEyeVector, uShininess, uDiffuseness);
    // color += specularLight;

    gl_FragColor = vec4(color, 1.);
    #include <colorspace_fragment>
}
