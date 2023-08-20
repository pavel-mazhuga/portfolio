varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vEyeVector;
varying float vPattern;

uniform float uShininess;
uniform float uDiffuseness;
uniform vec3 uLight;
uniform float uFresnelPower;

void main() {
    vec2 uv = vUv;
    vec3 color = vec3(vPattern);

    gl_FragColor = vec4(color, 1.);
}
