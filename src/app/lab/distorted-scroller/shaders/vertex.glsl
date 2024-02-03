varying vec2 vUv;
varying float vPosZ;

uniform float uFactor;
uniform vec2 uPlaneSize;

void main() {
    vUv = uv;

    vec3 newPos = position;
    float dist = length(vec2(newPos.x - uFactor * (uPlaneSize.x / 2.) * 3., newPos.y));
    float zChange = 1. / pow(dist, 1.2) * (uPlaneSize.x / 3.);
    newPos.z += zChange;
    vPosZ = newPos.z;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.);
}
