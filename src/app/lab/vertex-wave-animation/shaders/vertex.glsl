uniform float uProgress;
uniform float uRadius;

varying vec2 vUv;
varying float vPosZ;

void main() {
    vUv = uv;
    vec2 center = uv - 0.5;
    float radius = uRadius;
    vec4 pos = vec4(position, 1.0);
    pos.z += (1. - smoothstep(0.3, 0.6, length(center) * (radius - uProgress * radius)) - (1. - smoothstep(0.2, 0.4, length(center) * (radius - uProgress * radius)))) * 0.15 * uProgress;
    vPosZ = pos.z;

    gl_Position = projectionMatrix * modelViewMatrix * pos;
}