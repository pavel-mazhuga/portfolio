#pragma glslify: rotate2D = require('../../../glsl-utils/2d-rotation.glsl')

attribute float aSize;
attribute vec2 aParticleUv;

uniform float uTime;
uniform float uPointSize;
uniform sampler2D uPositions;

varying vec3 vPosition;

mat3 rotation3dY(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat3(
        c, 0.0, -s,
        0.0, 1.0, 0.0,
        s, 0.0, c
    );
}

void main() {
    vec4 data = texture(uPositions, aParticleUv);

    vec3 particlePosition = data.xyz;
    float distanceFactor = pow(1. - distance(particlePosition, vec3(0.)), 1.);
    // particlePosition.xz += rotate2D(position.y * 10. + uTime) * position.xz /*  * distanceFactor */ ;

    float progress = fract(uTime);

    // particlePosition.y += progress - 0.5;
    vPosition = particlePosition;

    vec4 modelPosition = modelMatrix * vec4(particlePosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;

    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = (1.0 / -viewPosition.z) * uPointSize * aSize * 10.;
}
