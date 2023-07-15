#pragma glslify: cnoise3 = require('glsl-noise/classic/3d')

uniform float uTime;

varying vec2 vUv;
varying vec3 vPosition;
varying float vPattern;

void main() {
    vec2 uv = vUv;
    float noise = cnoise3(vec3(vPosition.z * 60. + sin(vPosition.x) + sin(vPosition.y)));
    vec3 color = vec3(noise) * (vec3(100. / 255., 149. / 255., 237. / 255.) / vec3(138. / 255., 43. / 255., 226. / 255.)) * 0.8;

    gl_FragColor = vec4(color, 1.);
}
