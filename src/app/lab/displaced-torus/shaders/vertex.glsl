#pragma glslify: cnoise3 = require('glsl-noise/classic/3d')

uniform float uTime;

varying vec2 vUv;
varying vec3 vPosition;
varying float vPattern;

void main() {
    vUv = uv;
    vPosition = position;
    float noiseMult = clamp((abs((uv.x - 0.5)) - 0.3) * 3., 0., 1.);
    vPattern = noiseMult;
    float displacement = cnoise3(position * 5. + sin(uTime)) * noiseMult;
    vec3 newPosition = position + normal * displacement;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
