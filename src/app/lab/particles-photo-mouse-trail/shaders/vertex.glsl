#pragma glslify: coverTextureUv = require('../../../glsl-utils/cover-texture-uv.glsl');
#pragma glslify: curlNoise = require('../../../glsl-utils/noise/curl-noise.glsl')

uniform vec2 uResolution;
uniform sampler2D uPictureTexture;
uniform sampler2D uDisplacementTexture;
uniform vec2 uImageSize;
uniform vec2 uPlaneSize;
uniform float uTime;
uniform float uDisplacementIntensity;
uniform float uNoisePower;
uniform float uNoiseStrength;
uniform float uNoiseSpeed;
uniform bool uSickMode;
uniform bool uGrayscale;
uniform bool uDependParticleSizeOnBrightness;

attribute float aIntensity;
attribute float aAngle;

varying vec3 vColor;

void main() {
    vec3 newPosition = position;

    if (uSickMode) {
        newPosition += curlNoise(newPosition + uTime * 0.3) * 0.9;
    }

    float displacementIntensity = texture(uDisplacementTexture, uv).r;
    displacementIntensity = smoothstep(0.1, 0.3, displacementIntensity);

    vec3 displacement = normalize(vec3(cos(aAngle) * 0.2, sin(aAngle) * 0.2, 1.));
    displacement *= displacementIntensity * aIntensity * uDisplacementIntensity;

    newPosition += displacement;
    newPosition += curlNoise(newPosition + uNoiseSpeed + uTime * newPosition.z * uNoiseSpeed) * pow(newPosition.z, uNoisePower) * uNoiseStrength;

    vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    vec4 picture = texture(uPictureTexture, coverTextureUv(uImageSize, uPlaneSize, uv));
    float pictureIntensity = picture.r;

    gl_PointSize = 0.04 * uResolution.y;

    if (uDependParticleSizeOnBrightness) {
        gl_PointSize *= pictureIntensity * 3.;
    }

    gl_PointSize *= (1.0 / -viewPosition.z);

    vColor = uGrayscale ? vec3(pictureIntensity) : picture.rgb;
}
