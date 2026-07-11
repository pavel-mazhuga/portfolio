import {
    abs,
    div,
    dot,
    float,
    floor,
    Fn,
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
import type { Node } from 'three/webgpu';

const mod289Vec3 = /*#__PURE__*/ Fn(([xImmutable]: [Node<'vec3'>]) => {
    const x = vec3(xImmutable).toVar();

    return x.sub(floor(x.mul(1.0 / 289.0)).mul(289.0));
}).setLayout({
    name: 'mod289Vec3',
    type: 'vec3',
    inputs: [{ name: 'x', type: 'vec3' }],
});

const mod289Vec4 = /*#__PURE__*/ Fn(([xImmutable]: [Node<'vec4'>]) => {
    const x = vec4(xImmutable).toVar();

    return x.sub(floor(x.mul(1.0 / 289.0)).mul(289.0));
}).setLayout({
    name: 'mod289Vec4',
    type: 'vec4',
    inputs: [{ name: 'x', type: 'vec4' }],
});

export const mod289 = /*#__PURE__*/ overloadingFn([mod289Vec3, mod289Vec4] as unknown as Node[]);

const permute = /*#__PURE__*/ Fn(([xImmutable]: [Node<'vec4'>]) => {
    const x = vec4(xImmutable).toVar();

    return mod289(x.mul(34.0).add(1.0).mul(x));
}).setLayout({
    name: 'permute',
    type: 'vec4',
    inputs: [{ name: 'x', type: 'vec4' }],
});

const taylorInvSqrt = /*#__PURE__*/ Fn(([rImmutable]: [Node<'vec4'>]) => {
    const r = vec4(rImmutable).toVar();

    return sub(1.79284291400159, mul(0.85373472095314, r));
}).setLayout({
    name: 'taylorInvSqrt',
    type: 'vec4',
    inputs: [{ name: 'r', type: 'vec4' }],
});

const snoise = /*#__PURE__*/ Fn(([vImmutable]: [Node<'vec3'>]) => {
    const v = vec3(vImmutable).toVar();
    const C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const D = vec4(0.0, 0.5, 1.0, 2.0);
    const i = vec3(floor(v.add(dot(v, C.yyy)))).toVar();
    const x0 = vec3(v.sub(i).add(dot(i, C.xxx))).toVar();
    const g = vec3((step as (a: unknown, b: unknown) => ReturnType<typeof step>)(x0.yzx, x0.xyz)).toVar();
    const l = vec3(sub(1.0, g)).toVar();
    const i1 = vec3(min(g.xyz, l.zxy)).toVar();
    const i2 = vec3(max(g.xyz, l.zxy)).toVar();
    const x1 = vec3(x0.sub(i1).add(C.xxx)).toVar();
    const x2 = vec3(x0.sub(i2).add(C.yyy)).toVar();
    const x3 = vec3(x0.sub(D.yyy)).toVar();

    i.assign(mod289(i));
    const p = (
        permute(
            (
                permute(
                    (permute(i.z.add(vec4(0.0, i1.z, i2.z, 1.0))) as unknown as Node<'vec4'>)
                        .add(i.y)
                        .add(vec4(0.0, i1.y, i2.y, 1.0)),
                ) as unknown as Node<'vec4'>
            )
                .add(i.x)
                .add(vec4(0.0, i1.x, i2.x, 1.0)) as unknown as Node<'vec4'>,
        ) as unknown as Node<'vec4'>
    ).toVar();
    const nVal = float(0.142857142857).toVar();
    const ns = vec3(nVal.mul(D.wyz).sub(D.xzx)).toVar();
    const j = vec4(p.sub(mul(49.0, floor(p.mul(ns.z).mul(ns.z))))).toVar();
    const xFloor = vec4(floor(j.mul(ns.z))).toVar();
    const yFloor = vec4(floor(j.sub(mul(7.0, xFloor)))).toVar();
    const x = vec4(xFloor.mul(ns.x).add(ns.yyyy)).toVar();
    const y = vec4(yFloor.mul(ns.x).add(ns.yyyy)).toVar();
    const h = vec4(sub(1.0, abs(x)).sub(abs(y))).toVar();
    const b0 = vec4(x.xy, y.xy).toVar();
    const b1 = vec4(x.zw, y.zw).toVar();
    const s0 = vec4(floor(b0).mul(2.0).add(1.0)).toVar();
    const s1 = vec4(floor(b1).mul(2.0).add(1.0)).toVar();
    const sh = vec4((step as (e: unknown, x: unknown) => ReturnType<typeof step>)(h, vec4(float(0))).negate()).toVar();
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
    const m = vec4(max(sub(0.6, vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3))), float(0))).toVar();

    m.assign(m.mul(m));

    return mul(42.0, dot(m.mul(m), vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3))));
}).setLayout({
    name: 'snoise',
    type: 'float',
    inputs: [{ name: 'v', type: 'vec3' }],
});

const snoiseVec3 = /*#__PURE__*/ Fn(([xImmutable]: [Node<'vec3'>]) => {
    const x = vec3(xImmutable).toVar();
    const s = float(snoise(vec3(x))).toVar();
    const s1 = float(snoise(vec3(x.y.sub(19.1), x.z.add(33.4), x.x.add(47.2)))).toVar();
    const s2 = float(snoise(vec3(x.z.add(74.2), x.x.sub(124.5), x.y.add(99.4)))).toVar();

    return vec3(s, s1, s2).toVar();
}).setLayout({
    name: 'snoiseVec3',
    type: 'vec3',
    inputs: [{ name: 'x', type: 'vec3' }],
});

export const curlNoise = /*#__PURE__*/ Fn(([pImmutable]: [Node<'vec3'>]) => {
    const p = vec3(pImmutable).toVar();
    const e = float(0.1);
    const dx = vec3(e, 0.0, 0.0).toVar();
    const dy = vec3(0.0, e, 0.0).toVar();
    const dz = vec3(0.0, 0.0, e).toVar();
    const pX0 = vec3(snoiseVec3(p.sub(dx))).toVar();
    const pX1 = vec3(snoiseVec3(p.add(dx))).toVar();
    const pY0 = vec3(snoiseVec3(p.sub(dy))).toVar();
    const pY1 = vec3(snoiseVec3(p.add(dy))).toVar();
    const pZ0 = vec3(snoiseVec3(p.sub(dz))).toVar();
    const pZ1 = vec3(snoiseVec3(p.add(dz))).toVar();
    const x = float(pY1.z.sub(pY0.z).sub(pZ1.y).add(pZ0.y)).toVar();
    const y = float(pZ1.x.sub(pZ0.x).sub(pX1.z).add(pX0.z)).toVar();
    const z = float(pX1.y.sub(pX0.y).sub(pY1.x).add(pY0.x)).toVar();
    const divisor = float(div(1.0, mul(2.0, e)));

    return normalize(vec3(x, y, z).mul(divisor));
}).setLayout({
    name: 'curlNoise',
    type: 'vec3',
    inputs: [{ name: 'p', type: 'vec3' }],
});
