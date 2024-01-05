#pragma glslify: coverTexture = require(../../../glsl-utils/cover-texture.glsl)

uniform vec2 planeSize;

uniform sampler2D image;
uniform vec2 sizeImage;

uniform sampler2D image2;
uniform vec2 sizeImage2;

uniform float uTime;
uniform float uProgress;

varying vec2 vUv;

float remap(float value, float in_min, float in_max, float out_min, float out_max) {
    float mapped = ((value - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
    return clamp(mapped, out_min, out_max);
}

void main() {
    vec2 uv = vUv;
    vec2 center = uv - 0.5;
    float len = length(center);
    vec2 ripple = uv + center / len * 0.03 * cos(len * 12. - uTime * 4.) * (0.5 - abs(uProgress - 0.5)) * 2.;
    float duration = 8.;
    float delta = 0.;
    vec2 modifiedUv = mix(ripple, uv, delta);

    vec4 color1 = coverTexture(image, sizeImage, planeSize, modifiedUv);
    vec4 color2 = coverTexture(image2, sizeImage2, planeSize, modifiedUv);
    float fade = smoothstep(uProgress - 0.2, remap(uProgress, 0., 1., -0.2, 0.8) + 0.2, len);

    gl_FragColor = mix(color1, color2, clamp(0., 1., fade + length(modifiedUv - uv) * 2.));
    #include <colorspace_fragment>
}
