attribute float aKoef;
varying vec2 vUv;
varying float vKoef;

void main() {
    vUv = uv;
    vKoef = aKoef;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
