uniform float rotation; // plane rotation
uniform float time;
uniform float amp; // sine amplifier
varying vec2 vUv;
varying float vPosZ;

mat4 rotationZ(in float angle) {
    return mat4(
        cos(angle),		-sin(angle),	0,	0,
        sin(angle),		cos(angle),		0,	0,
        0,				    0,		        1,	0,
        0,				    0,		        0,	1
    );
}      

void main() {
    vUv = uv;
    vec4 pos = vec4(position, 1.0) * rotationZ(rotation);
    pos.z += sin(uv.x * 6.0 + uv.y * 0.7 + time * 0.002) * amp;
    vPosZ = pos.z;

    gl_Position = projectionMatrix * modelViewMatrix * pos;
}