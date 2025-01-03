// @ts-nocheck
// Three.js Transpiler r172
import {
    Fn,
    abs,
    div,
    dot,
    float,
    floor,
    max,
    min,
    mul,
    normalize,
    overloadingFn,
    step,
    sub,
    vec2,
    vec3,
    vec4,
} from 'three/tsl';

export const mod289_0 = /*#__PURE__*/ Fn(([x_immutable]) => {
    const x = vec3(x_immutable).toVar();

    return x.sub(floor(x.mul(1.0 / 289.0)).mul(289.0));
}).setLayout({
    name: 'mod289_0',
    type: 'vec3',
    inputs: [{ name: 'x', type: 'vec3' }],
});

export const mod289_1 = /*#__PURE__*/ Fn(([x_immutable]) => {
    const x = vec4(x_immutable).toVar();

    return x.sub(floor(x.mul(1.0 / 289.0)).mul(289.0));
}).setLayout({
    name: 'mod289_1',
    type: 'vec4',
    inputs: [{ name: 'x', type: 'vec4' }],
});

export const mod289 = /*#__PURE__*/ overloadingFn([mod289_0, mod289_1]);

export const permute = /*#__PURE__*/ Fn(([x_immutable]) => {
    const x = vec4(x_immutable).toVar();

    return mod289(x.mul(34.0).add(1.0).mul(x));
}).setLayout({
    name: 'permute',
    type: 'vec4',
    inputs: [{ name: 'x', type: 'vec4' }],
});

export const taylorInvSqrt = /*#__PURE__*/ Fn(([r_immutable]) => {
    const r = vec4(r_immutable).toVar();

    return sub(1.79284291400159, mul(0.85373472095314, r));
}).setLayout({
    name: 'taylorInvSqrt',
    type: 'vec4',
    inputs: [{ name: 'r', type: 'vec4' }],
});

export const snoise = /*#__PURE__*/ Fn(([v_immutable]) => {
    const v = vec3(v_immutable).toVar();
    const C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const D = vec4(0.0, 0.5, 1.0, 2.0);
    const i = vec3(floor(v.add(dot(v, C.yyy)))).toVar();
    const x0 = vec3(v.sub(i).add(dot(i, C.xxx))).toVar();
    const g = vec3(step(x0.yzx, x0.xyz)).toVar();
    const l = vec3(sub(1.0, g)).toVar();
    const i1 = vec3(min(g.xyz, l.zxy)).toVar();
    const i2 = vec3(max(g.xyz, l.zxy)).toVar();
    const x1 = vec3(x0.sub(i1).add(C.xxx)).toVar();
    const x2 = vec3(x0.sub(i2).add(C.yyy)).toVar();
    const x3 = vec3(x0.sub(D.yyy)).toVar();
    i.assign(mod289(i));
    const p = vec4(
        permute(
            permute(
                permute(i.z.add(vec4(0.0, i1.z, i2.z, 1.0)))
                    .add(i.y)
                    .add(vec4(0.0, i1.y, i2.y, 1.0)),
            )
                .add(i.x)
                .add(vec4(0.0, i1.x, i2.x, 1.0)),
        ),
    ).toVar();
    const n_ = float(0.142857142857).toVar();
    const ns = vec3(n_.mul(D.wyz).sub(D.xzx)).toVar();
    const j = vec4(p.sub(mul(49.0, floor(p.mul(ns.z).mul(ns.z))))).toVar();
    const x_ = vec4(floor(j.mul(ns.z))).toVar();
    const y_ = vec4(floor(j.sub(mul(7.0, x_)))).toVar();
    const x = vec4(x_.mul(ns.x).add(ns.yyyy)).toVar();
    const y = vec4(y_.mul(ns.x).add(ns.yyyy)).toVar();
    const h = vec4(sub(1.0, abs(x)).sub(abs(y))).toVar();
    const b0 = vec4(x.xy, y.xy).toVar();
    const b1 = vec4(x.zw, y.zw).toVar();
    const s0 = vec4(floor(b0).mul(2.0).add(1.0)).toVar();
    const s1 = vec4(floor(b1).mul(2.0).add(1.0)).toVar();
    const sh = vec4(step(h, vec4(0.0)).negate()).toVar();
    const a0 = vec4(b0.xzyw.add(s0.xzyw.mul(sh.xxyy))).toVar();
    const a1 = vec4(b1.xzyw.add(s1.xzyw.mul(sh.zzww))).toVar();
    const p0 = vec3(a0.xy, h.x).toVar();
    const p1 = vec3(a0.zw, h.y).toVar();
    const p2 = vec3(a1.xy, h.z).toVar();
    const p3 = vec3(a1.zw, h.w).toVar();
    const norm = vec4(taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)))).toVar();
    p0.mulAssign(norm.x);
    p1.mulAssign(norm.y);
    p2.mulAssign(norm.z);
    p3.mulAssign(norm.w);
    const m = vec4(max(sub(0.6, vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3))), 0.0)).toVar();
    m.assign(m.mul(m));

    return mul(42.0, dot(m.mul(m), vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3))));
}).setLayout({
    name: 'snoise',
    type: 'float',
    inputs: [{ name: 'v', type: 'vec3' }],
});

export const snoiseVec3 = /*#__PURE__*/ Fn(([x_immutable]) => {
    const x = vec3(x_immutable).toVar();
    const s = float(snoise(vec3(x))).toVar();
    const s1 = float(snoise(vec3(x.y.sub(19.1), x.z.add(33.4), x.x.add(47.2)))).toVar();
    const s2 = float(snoise(vec3(x.z.add(74.2), x.x.sub(124.5), x.y.add(99.4)))).toVar();
    const c = vec3(s, s1, s2).toVar();

    return c;
}).setLayout({
    name: 'snoiseVec3',
    type: 'vec3',
    inputs: [{ name: 'x', type: 'vec3' }],
});

export const curlNoise = /*#__PURE__*/ Fn(([p_immutable]) => {
    const p = vec3(p_immutable).toVar();
    const e = float(0.1);
    const dx = vec3(e, 0.0, 0.0).toVar();
    const dy = vec3(0.0, e, 0.0).toVar();
    const dz = vec3(0.0, 0.0, e).toVar();
    const p_x0 = vec3(snoiseVec3(p.sub(dx))).toVar();
    const p_x1 = vec3(snoiseVec3(p.add(dx))).toVar();
    const p_y0 = vec3(snoiseVec3(p.sub(dy))).toVar();
    const p_y1 = vec3(snoiseVec3(p.add(dy))).toVar();
    const p_z0 = vec3(snoiseVec3(p.sub(dz))).toVar();
    const p_z1 = vec3(snoiseVec3(p.add(dz))).toVar();
    const x = float(p_y1.z.sub(p_y0.z).sub(p_z1.y).add(p_z0.y)).toVar();
    const y = float(p_z1.x.sub(p_z0.x).sub(p_x1.z).add(p_x0.z)).toVar();
    const z = float(p_x1.y.sub(p_x0.y).sub(p_y1.x).add(p_y0.x)).toVar();
    const divisor = float(div(1.0, mul(2.0, e)));

    return normalize(vec3(x, y, z).mul(divisor));
}).setLayout({
    name: 'curlNoise',
    type: 'vec3',
    inputs: [{ name: 'p', type: 'vec3' }],
});
