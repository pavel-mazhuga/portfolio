#pragma glslify: smoothMod = require(../../../glsl-utils/smoothmod.glsl)
#pragma glslify: fit = require(../../../glsl-utils/fit.glsl)

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vEyeVector;
varying float vPattern;

void main() {
    vUv = uv;
    vNormal = normalize(modelMatrix * vec4(normal, 0.)).xyz;

    float pattern = fit(smoothMod(uv.x * 10., 1., 1.), 0.3, 0.7, 0., 1.);
    vPattern = pattern;
    
    vec3 newPosition = position * vec3(pattern);

    vec4 worldPos = modelMatrix * vec4(newPosition, 1.0);
    vEyeVector = normalize(worldPos.xyz - cameraPosition);
    vec4 mvPosition = viewMatrix * worldPos;

    gl_Position = projectionMatrix * mvPosition;
}
