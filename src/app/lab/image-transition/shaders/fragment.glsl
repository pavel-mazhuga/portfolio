#pragma glslify: coverTexture = require(../../../glsl-utils/cover-texture.glsl)
#pragma glslify: remap = require(../../../glsl-utils/remap.glsl)

uniform vec2 uPlaneSize;

uniform sampler2D uCurrentImage;
uniform vec2 uCurrentImageSize;

uniform sampler2D uNextImage;
uniform vec2 uNextImageSize;

uniform float uTime;
uniform float uProgress;
uniform float uWaveSpeed;
uniform float uRippleStrength;
uniform float uFadeOffset;
uniform float uInnerRippleSpeed;

varying vec2 vUv;

void main() {
    vec2 uv = vUv;
    vec2 center = uv - 0.5;
    float len = length(center);
    vec2 ripple = uv + center / len * 0.03 * cos(len * 12. - uTime * uWaveSpeed) * (0.5 - abs(uProgress - 0.5)) * uRippleStrength;
    vec2 modifiedUv = mix(ripple, uv, 0.);

    vec4 color1 = coverTexture(uCurrentImage, uCurrentImageSize, uPlaneSize, modifiedUv);
    vec4 color2 = coverTexture(uNextImage, uNextImageSize, uPlaneSize, modifiedUv);
    float fade = smoothstep(uProgress - uFadeOffset, remap(uProgress, 0., 1., -uFadeOffset, 1. - uFadeOffset) + uFadeOffset, len);

    gl_FragColor = mix(color1, color2, clamp(0., 1., fade + length(modifiedUv - uv) * uInnerRippleSpeed));
    #include <colorspace_fragment>
}
