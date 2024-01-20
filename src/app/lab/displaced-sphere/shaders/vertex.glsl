#pragma glslify: cnoise3 = require('glsl-noise/classic/3d')

uniform float uTime;

varying float vDisplacement;
varying vec2 vUv;
varying vec3 vPosition;
varying float vPattern;
varying vec3 vNormal;
varying vec3 vEyeVector;

void main() {
    vUv = uv;
    vNormal = normalize(modelMatrix * vec4(normal, 0.)).xyz;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vEyeVector = normalize(worldPos.xyz - cameraPosition);
    float noiseMult = clamp((abs(position.y + 1.) * 0.5) * 3., 0., 1.) * 0.1;
    vPattern = noiseMult;
    float displacement = cnoise3((position + uTime * 0.4) * 2. + (sin(uTime * 0.7) * 0.)) * noiseMult;
    vDisplacement = displacement;
    vec3 newPosition = position + normal * displacement;
    vPosition = newPosition;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
