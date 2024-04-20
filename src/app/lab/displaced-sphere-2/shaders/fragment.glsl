#pragma glslify: ambientLight = require('../../../glsl-utils/lighting/ambient-light.glsl')
#pragma glslify: directionalLight = require('../../../glsl-utils/lighting/directional-light.glsl')

varying vec3 vNormal;
varying vec3 vViewDirection;
varying vec3 vEyeVector;
varying float vPattern;

uniform float uGradientStrength;
uniform vec3 uColor;
uniform vec3 uAmbientLightColor;
uniform float uAmbientLightIntensity;
uniform vec3 uDirectionalLightColor;
uniform float uDirectionalLightIntensity;
uniform vec3 uDirectionalLightPosition;

void main() {
    vec3 color = pow(vPattern, uGradientStrength) * uColor;

    vec3 light = vec3(0.);
    light += ambientLight(uAmbientLightColor, uAmbientLightIntensity);
    light += directionalLight(uDirectionalLightColor, uDirectionalLightIntensity, vNormal, uDirectionalLightPosition, vViewDirection, 20.);

    color *= light;

    gl_FragColor = vec4(color, 1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
