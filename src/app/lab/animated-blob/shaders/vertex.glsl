#pragma glslify: snoise4 = require(glsl-noise/simplex/4d)

uniform float u_time;
uniform float u_amplitude;
uniform float u_frequency;
uniform float u_offset;

out vec3 vPos;
out vec3 vNormal;

void main () {
    vNormal = normalMatrix * normalize(normal);

    float distortion = snoise4(vec4(normal * u_frequency + u_offset, u_time)) * u_amplitude;
    vec3 newPosition = position + (normal * distortion);

    vec4 mvp = modelViewMatrix * vec4(newPosition, 1.0);
    vPos = mvp.xyz;
    gl_Position = projectionMatrix * mvp;
}