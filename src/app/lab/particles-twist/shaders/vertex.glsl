#pragma glslify: rotate2D = require('../../../glsl-utils/2d-rotation.glsl')
#pragma glslify: remap = require('../../../glsl-utils/remap.glsl')

attribute float aSize;
attribute vec2 aParticleUv;

uniform float uTime;
uniform float uPointSize;
uniform vec2 uResolution;
uniform sampler2D uPositions;

varying float vAlpha;

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
    float lifespan = data.a;
    vAlpha = 1. - abs(lifespan - 0.5) * 2.;
    vAlpha = remap(vAlpha, 0.3, 0.7, 0., 1.);

    vec4 modelPosition = modelMatrix * vec4(particlePosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;

    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = uPointSize * aSize * uResolution.y * vAlpha;
    gl_PointSize *= (1.0 / -viewPosition.z);
}
