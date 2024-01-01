#pragma glslify: coverTexture = require(../../../glsl-utils/cover-texture.glsl)

uniform vec2 planeSize;
uniform vec2 sizeImage;
uniform sampler2D image;

varying vec2 vUv;
varying float vPosZ;   

void main() {
    vec2 uv = vUv;

    gl_FragColor = coverTexture(image, sizeImage, planeSize, uv);
    gl_FragColor.rgb *= 1.0 - smoothstep(1.0, -4.0, vPosZ);
    #include <colorspace_fragment>
}
