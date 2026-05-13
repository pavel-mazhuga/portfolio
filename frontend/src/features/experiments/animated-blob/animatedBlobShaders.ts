/** Inlined GLSL (no glslify). 4D simplex noise from Ashima Arts / stegu webgl-noise (MIT). */

const SNOISE_4D = /* glsl */ `
vec4 mod289_4(vec4 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

float mod289_4f(float x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute_4(vec4 x) {
    return mod289_4(((x * 34.0) + 10.0) * x);
}

float permute_4f(float x) {
    return mod289_4f(((x * 34.0) + 10.0) * x);
}

vec4 taylorInvSqrt_4(vec4 r) {
    return 1.79284291400159 - 0.85373472095314 * r;
}

float taylorInvSqrt_4f(float r) {
    return 1.79284291400159 - 0.85373472095314 * r;
}

vec4 grad4(float j, vec4 ip) {
    const vec4 ones = vec4(1.0, 1.0, 1.0, -1.0);
    vec4 p, s;

    p.xyz = floor(fract(vec3(j) * ip.xyz) * 7.0) * ip.z - 1.0;
    p.w = 1.5 - dot(abs(p.xyz), ones.xyz);
    s = vec4(lessThan(p, vec4(0.0)));
    p.xyz = p.xyz + (s.xyz * 2.0 - 1.0) * s.www;

    return p;
}

#define F4_SIMPLEX 0.309016994374947451

float snoise(vec4 v) {
    const vec4 C = vec4(
        0.138196601125011,
        0.276393202250021,
        0.414589803375032,
        -0.447213595499958
    );

    vec4 i = floor(v + dot(v, vec4(F4_SIMPLEX)));
    vec4 x0 = v - i + dot(i, C.xxxx);

    vec4 i0;
    vec3 isX = step(x0.yzw, x0.xxx);
    vec3 isYZ = step(x0.zww, x0.yyz);
    i0.x = isX.x + isX.y + isX.z;
    i0.yzw = 1.0 - isX;
    i0.y += isYZ.x + isYZ.y;
    i0.zw += 1.0 - isYZ.xy;
    i0.z += isYZ.z;
    i0.w += 1.0 - isYZ.z;

    vec4 i3 = clamp(i0, 0.0, 1.0);
    vec4 i2 = clamp(i0 - 1.0, 0.0, 1.0);
    vec4 i1 = clamp(i0 - 2.0, 0.0, 1.0);

    vec4 x1 = x0 - i1 + C.xxxx;
    vec4 x2 = x0 - i2 + C.yyyy;
    vec4 x3 = x0 - i3 + C.zzzz;
    vec4 x4 = x0 + C.wwww;

    i = mod289_4(i);
    float j0 = permute_4f(permute_4f(permute_4f(permute_4f(i.w) + i.z) + i.y) + i.x);
    vec4 j1 = permute_4(
        permute_4(
            permute_4(
                permute_4(i.w + vec4(i1.w, i2.w, i3.w, 1.0)) + i.z + vec4(i1.z, i2.z, i3.z, 1.0)
            ) + i.y + vec4(i1.y, i2.y, i3.y, 1.0)
        ) + i.x + vec4(i1.x, i2.x, i3.x, 1.0)
    );

    vec4 ip = vec4(1.0 / 294.0, 1.0 / 49.0, 1.0 / 7.0, 0.0);

    vec4 p0 = grad4(j0, ip);
    vec4 p1 = grad4(j1.x, ip);
    vec4 p2 = grad4(j1.y, ip);
    vec4 p3 = grad4(j1.z, ip);
    vec4 p4 = grad4(j1.w, ip);

    vec4 norm = taylorInvSqrt_4(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    p4 *= taylorInvSqrt_4f(dot(p4, p4));

    vec3 m0 = max(0.6 - vec3(dot(x0, x0), dot(x1, x1), dot(x2, x2)), 0.0);
    vec2 m1 = max(0.6 - vec2(dot(x3, x3), dot(x4, x4)), 0.0);
    m0 = m0 * m0;
    m1 = m1 * m1;
    return 49.0 * (
        dot(
            m0 * m0,
            vec3(dot(p0, x0), dot(p1, x1), dot(p2, x2))
        ) + dot(m1 * m1, vec2(dot(p3, x3), dot(p4, x4)))
    );
}
`;

export const VERTEX_SHADER = /* glsl */ `
${SNOISE_4D}

uniform float u_time;
uniform float u_amplitude;
uniform float u_frequency;
uniform float u_offset;

varying vec3 vPos;
varying vec3 vNormal;

void main() {
    vNormal = normalMatrix * normalize(normal);

    vec3 n = normal * u_frequency + vec3(u_offset);
    float distortion = snoise(vec4(n, u_time)) * u_amplitude;
    vec3 newPosition = position + normal * distortion;

    vec4 mvp = modelViewMatrix * vec4(newPosition, 1.0);
    vPos = mvp.xyz;
    gl_Position = projectionMatrix * mvp;
}
`;

export const FRAGMENT_SHADER = /* glsl */ `
uniform sampler2D u_matCapMap;

varying vec3 vPos;
varying vec3 vNormal;

void main() {
    vec3 eye = normalize(vPos);
    vec3 r = reflect(eye, vNormal);
    float m = 2.0 * sqrt(pow(r.x, 2.0) + pow(r.y, 2.0) + pow(r.z + 1.2, 2.0));
    vec2 vN = r.xy / m + 0.5;
    vec3 mat = texture2D(u_matCapMap, vN).rgb;

    gl_FragColor = vec4(mat, 1.0);
    #include <colorspace_fragment>
}
`;
