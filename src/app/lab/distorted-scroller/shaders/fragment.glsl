#pragma glslify: coverTexture = require(../../../glsl-utils/cover-texture.glsl)
#pragma glslify: grayscale = require(../../../glsl-utils/grayscale.glsl)

varying vec2 vUv;
varying float vPosZ;

uniform float uFactor;
uniform vec2 uPlaneSize;
uniform sampler2D uImage;
uniform vec2 uImageSize;
uniform float uTime;

void main() {
    vec2 uv = vUv;
    vec4 color = coverTexture(uImage, uImageSize, uPlaneSize, uv);
    color.rgb = grayscale(color.rgb, 1. - clamp(vPosZ, 0., 1.));

    gl_FragColor = color;
    #include <colorspace_fragment>
}
