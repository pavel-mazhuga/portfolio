// // Three.js Transpiler r167
// import {
//     Node,
//     ShaderNodeObject,
//     VarNode,
//     abs,
//     dot,
//     float,
//     floor,
//     max,
//     min,
//     mul, // @ts-ignore
//     overloadingFn,
//     step,
//     sub,
//     tslFn,
//     vec2,
//     vec3,
//     vec4,
// } from 'three/webgpu';
// const mod289_0 = /*#__PURE__*/ tslFn<ShaderNodeObject<Node>[], ShaderNodeObject<VarNode>>(([x_immutable]) => {
//     const x = vec3(x_immutable).toVar();
//     return x.sub(floor(x.mul(float(1).div(289))).mul(289));
// }); /* .setLayout({
//     name: 'mod289_0',
//     type: 'vec3',
//     inputs: [{ name: 'x', type: 'vec3' }],
// }); */
// const mod289_1 = /*#__PURE__*/ tslFn<ShaderNodeObject<Node>[], ShaderNodeObject<VarNode>>(([x_immutable]) => {
//     const x = vec4(x_immutable).toVar();
//     return x.sub(floor(x.mul(float(1).div(289))).mul(289));
// }); /* .setLayout({
//     name: 'mod289_1',
//     type: 'vec4',
//     inputs: [{ name: 'x', type: 'vec4' }],
// }); */
// // const mod289 = /*#__PURE__*/ overloadingFn([mod289_0, mod289_1]);
// const mod289 = /*#__PURE__*/ mod289_0;
// const permute = /*#__PURE__*/ tslFn<ShaderNodeObject<Node>[], ShaderNodeObject<VarNode>>(([x_immutable]) => {
//     const x = vec4(x_immutable).toVar();
//     return mod289(x.mul(float(34)).add(float(1)).mul(x));
// }); /* .setLayout({
//     name: 'permute',
//     type: 'vec4',
//     inputs: [{ name: 'x', type: 'vec4' }],
// }); */
// const taylorInvSqrt = /*#__PURE__*/ tslFn<ShaderNodeObject<Node>[]>(([r_immutable]) => {
//     const r = vec4(r_immutable).toVar();
//     return sub(1.79284291400159, mul(0.85373472095314, r));
// }); /* .setLayout({
//     name: 'taylorInvSqrt',
//     type: 'vec4',
//     inputs: [{ name: 'r', type: 'vec4' }],
// }); */
// export const simplexNoise3d = /*#__PURE__*/ tslFn<ShaderNodeObject<Node>[]>(([v_immutable]) => {
//     // const v = vec3(v_immutable).toVar();
//     const v = v_immutable;
//     const C = vec2(1.0 / 6.0, 1.0 / 3.0);
//     const D = vec4(0.0, 0.5, 1.0, 2.0);
//     const i = vec3(floor(v.add(dot(v, C.yyy)))).toVar();
//     const x0 = vec3(v.sub(i).add(dot(i, C.xxx))).toVar();
//     const g = vec3(step(x0.yzx, x0.xyz)).toVar();
//     const l = vec3(sub(1.0, g)).toVar();
//     const i1 = vec3(min(g.xyz, l.zxy)).toVar();
//     const i2 = vec3(max(g.xyz, l.zxy)).toVar();
//     const x1 = vec3(x0.sub(i1).add(C.xxx)).toVar();
//     const x2 = vec3(x0.sub(i2).add(C.yyy)).toVar();
//     const x3 = vec3(x0.sub(D.yyy)).toVar();
//     i.assign(mod289(i));
//     const p = vec4(
//         permute(
//             permute(
//                 permute(i.z.add(vec4(0.0, i1.z, i2.z, 1.0)))
//                     .add(i.y)
//                     .add(vec4(0.0, i1.y, i2.y, 1.0)),
//             )
//                 .add(i.x)
//                 .add(vec4(0.0, i1.x, i2.x, 1.0)),
//         ),
//     ).toVar();
//     const n_ = float(0.142857142857).toVar();
//     const ns = vec3(n_.mul(D.wyz).sub(D.xzx)).toVar();
//     const j = vec4(p.sub(mul(49.0, floor(p.mul(ns.z).mul(ns.z))))).toVar();
//     const x_ = vec4(floor(j.mul(ns.z))).toVar();
//     const y_ = vec4(floor(j.sub(mul(7.0, x_)))).toVar();
//     const x = vec4(x_.mul(ns.x).add(ns.yyyy)).toVar();
//     const y = vec4(y_.mul(ns.x).add(ns.yyyy)).toVar();
//     const h = vec4(sub(1.0, abs(x)).sub(abs(y))).toVar();
//     const b0 = vec4(x.xy, y.xy).toVar();
//     const b1 = vec4(x.zw, y.zw).toVar();
//     const s0 = vec4(floor(b0).mul(2.0).add(1.0)).toVar();
//     const s1 = vec4(floor(b1).mul(2.0).add(1.0)).toVar();
//     const sh = vec4(step(h, vec4(0.0)).negate()).toVar();
//     const a0 = vec4(b0.xzyw.add(s0.xzyw.mul(sh.xxyy))).toVar();
//     const a1 = vec4(b1.xzyw.add(s1.xzyw.mul(sh.zzww))).toVar();
//     const p0 = vec3(a0.xy, h.x).toVar();
//     const p1 = vec3(a0.zw, h.y).toVar();
//     const p2 = vec3(a1.xy, h.z).toVar();
//     const p3 = vec3(a1.zw, h.w).toVar();
//     const norm = vec4(taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)))).toVar();
//     p0.mulAssign(norm.x);
//     p1.mulAssign(norm.y);
//     p2.mulAssign(norm.z);
//     p3.mulAssign(norm.w);
//     const m = vec4(max(sub(0.6, vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3))), 0.0)).toVar();
//     m.assign(m.mul(m));
//     return mul(42.0, dot(m.mul(m), vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3))));
// }); /* .setLayout({
//     name: 'snoise',
//     type: 'float',
//     inputs: [{ name: 'v', type: 'vec3' }],
// }); */
// Three.js Transpiler r167
import {
    Node,
    ShaderNodeObject,
    VarNode,
    abs,
    clamp,
    cond,
    dot,
    float,
    floor,
    fract,
    lessThan,
    max,
    min,
    mul, // @ts-ignore
    overloadingFn,
    step,
    sub,
    tslFn,
    vec2,
    vec3,
    vec4,
} from 'three/tsl';

export const mod289_0 = /*#__PURE__*/ tslFn<ShaderNodeObject<Node>[]>(([x]) => {
    return x.sub(floor(x.mul(1 / 289)).mul(289));
}); /* .setLayout({
    name: 'mod289_0',
    type: 'float',
    inputs: [{ name: 'x', type: 'float', qualifier: 'in' }],
}) */

export const mod289_1 = /*#__PURE__*/ tslFn<ShaderNodeObject<Node>[]>(([x]) => {
    return x.sub(floor(x.mul(1 / 289)).mul(289));
}); /* .setLayout({
    name: 'mod289_1',
    type: 'vec2',
    inputs: [{ name: 'x', type: 'vec2', qualifier: 'in' }],
}) */

export const mod289_2 = /*#__PURE__*/ tslFn<ShaderNodeObject<Node>[]>(([x]) => {
    return x.sub(floor(x.mul(1 / 289)).mul(289));
}); /* .setLayout({
    name: 'mod289_2',
    type: 'vec3',
    inputs: [{ name: 'x', type: 'vec3', qualifier: 'in' }],
}) */

export const mod289_3 = /*#__PURE__*/ tslFn<ShaderNodeObject<Node>[]>(([x]) => {
    return x.sub(floor(x.mul(1 / 289)).mul(289));
}); /* .setLayout({
    name: 'mod289_3',
    type: 'vec4',
    inputs: [{ name: 'x', type: 'vec4', qualifier: 'in' }],
}) */

// export const mod289 = /*#__PURE__*/ overloadingFn([mod289_0, mod289_1, mod289_2, mod289_3]);
export const mod289 = /*#__PURE__*/ mod289_2;

export const permute_0 = /*#__PURE__*/ tslFn<ShaderNodeObject<Node>[]>(([v]) => {
    return mod289(v.mul(34.0).add(1.0).mul(v));
}); /* .setLayout({
    name: 'permute_0',
    type: 'float',
    inputs: [{ name: 'v', type: 'float', qualifier: 'in' }],
}) */

export const permute_1 = /*#__PURE__*/ tslFn<ShaderNodeObject<Node>[]>(([v]) => {
    return mod289(v.mul(34.0).add(1.0).mul(v));
}); /* .setLayout({
    name: 'permute_1',
    type: 'vec2',
    inputs: [{ name: 'v', type: 'vec2', qualifier: 'in' }],
}) */

export const permute_2 = /*#__PURE__*/ tslFn<ShaderNodeObject<Node>[]>(([v]) => {
    return mod289(v.mul(34.0).add(1.0).mul(v));
}); /* .setLayout({
    name: 'permute_2',
    type: 'vec3',
    inputs: [{ name: 'v', type: 'vec3', qualifier: 'in' }],
}) */

export const permute_3 = /*#__PURE__*/ tslFn<ShaderNodeObject<Node>[]>(([v]) => {
    return mod289(v.mul(34.0).add(1.0).mul(v));
}); /* .setLayout({
    name: 'permute_3',
    type: 'vec4',
    inputs: [{ name: 'v', type: 'vec4', qualifier: 'in' }],
}) */

// export const permute = /*#__PURE__*/ overloadingFn([permute_0, permute_1, permute_2, permute_3]);
export const permute = /*#__PURE__*/ permute_2;

export const taylorInvSqrt_0 = /*#__PURE__*/ tslFn<ShaderNodeObject<Node>[]>(([r_immutable]) => {
    const r = float(r_immutable).toVar();

    return sub(1.79284291400159, mul(0.85373472095314, r));
}); /* .setLayout({
    name: 'taylorInvSqrt_0',
    type: 'float',
    inputs: [{ name: 'r', type: 'float', qualifier: 'in' }],
}) */

export const taylorInvSqrt_1 = /*#__PURE__*/ tslFn<ShaderNodeObject<Node>[]>(([r_immutable]) => {
    const r = vec2(r_immutable).toVar();

    return sub(1.79284291400159, mul(0.85373472095314, r));
}); /* .setLayout({
    name: 'taylorInvSqrt_1',
    type: 'vec2',
    inputs: [{ name: 'r', type: 'vec2', qualifier: 'in' }],
}) */

export const taylorInvSqrt_2 = /*#__PURE__*/ tslFn<ShaderNodeObject<Node>[]>(([r_immutable]) => {
    const r = vec3(r_immutable).toVar();

    return sub(1.79284291400159, mul(0.85373472095314, r));
}); /* .setLayout({
    name: 'taylorInvSqrt_2',
    type: 'vec3',
    inputs: [{ name: 'r', type: 'vec3', qualifier: 'in' }],
}) */

export const taylorInvSqrt_3 = /*#__PURE__*/ tslFn<ShaderNodeObject<Node>[]>(([r_immutable]) => {
    const r = vec4(r_immutable).toVar();

    return sub(1.79284291400159, mul(0.85373472095314, r));
}); /* .setLayout({
    name: 'taylorInvSqrt_3',
    type: 'vec4',
    inputs: [{ name: 'r', type: 'vec4', qualifier: 'in' }],
}) */

// export const taylorInvSqrt = /*#__PURE__*/ overloadingFn([
//     taylorInvSqrt_0,
//     taylorInvSqrt_1,
//     taylorInvSqrt_2,
//     taylorInvSqrt_3,
// ]);
export const taylorInvSqrt = /*#__PURE__*/ taylorInvSqrt_2;

export const grad4 = /*#__PURE__*/ tslFn<ShaderNodeObject<Node>[], ShaderNodeObject<VarNode>>(
    ([j_immutable, ip_immutable]) => {
        const ip = vec4(ip_immutable).toVar();
        const j = float(j_immutable).toVar();
        const ones = vec4(1.0, 1.0, 1.0, -1.0);
        const p = vec4().toVar(),
            s = vec4().toVar();
        p.xyz.assign(
            floor(fract(vec3(j).mul(ip.xyz)).mul(7.0))
                .mul(ip.z)
                .sub(1.0),
        );
        p.w.assign(sub(1.5, dot(abs(p.xyz), ones.xyz)));
        s.assign(vec4(lessThan(p, vec4(0.0))));
        p.xyz.assign(p.xyz.add(s.xyz.mul(2.0).sub(1.0).mul(s.www)));

        return p;
    },
); /* .setLayout({
    name: 'grad4',
    type: 'vec4',
    inputs: [
        { name: 'j', type: 'float' },
        { name: 'ip', type: 'vec4' },
    ],
}) */

export const snoise_0 = /*#__PURE__*/ tslFn<ShaderNodeObject<Node>[]>(([v_immutable]) => {
    const v = vec2(v_immutable).toVar();
    const C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    const i = vec2(floor(v.add(dot(v, C.yy)))).toVar();
    const x0 = vec2(v.sub(i).add(dot(i, C.xx))).toVar();
    const i1 = vec2().toVar();
    i1.assign(cond(x0.x.greaterThan(x0.y), vec2(1.0, 0.0), vec2(0.0, 1.0)));
    const x12 = vec4(x0.xyxy.add(C.xxzz)).toVar();
    x12.xy.subAssign(i1);
    i.assign(mod289(i));
    const p = vec3(
        permute(
            permute(i.y.add(vec3(0.0, i1.y, 1.0)))
                .add(i.x)
                .add(vec3(0.0, i1.x, 1.0)),
        ),
    ).toVar();
    const m = vec3(max(sub(0.5, vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw))), 0.0)).toVar();
    m.assign(m.mul(m));
    m.assign(m.mul(m));
    const x = vec3(mul(2.0, fract(p.mul(C.www))).sub(1.0)).toVar();
    const h = vec3(abs(x).sub(0.5)).toVar();
    const ox = vec3(floor(x.add(float(0.5)))).toVar();
    const a0 = vec3(x.sub(ox)).toVar();
    m.mulAssign(sub(1.79284291400159, mul(0.85373472095314, a0.mul(a0).add(h.mul(h)))));
    const g = vec3().toVar();
    g.x.assign(a0.x.mul(x0.x).add(h.x.mul(x0.y)));
    g.yz.assign(a0.yz.mul(x12.xz).add(h.yz.mul(x12.yw)));

    return mul(130.0, dot(m, g));
}); /* .setLayout({
    name: 'snoise_0',
    type: 'float',
    inputs: [{ name: 'v', type: 'vec2', qualifier: 'in' }],
}) */

export const snoise_1 = /*#__PURE__*/ tslFn<ShaderNodeObject<Node>[]>(([v_immutable]) => {
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
}); /* .setLayout({
    name: 'snoise_1',
    type: 'float',
    inputs: [{ name: 'v', type: 'vec3', qualifier: 'in' }],
}) */

export const snoise_2 = /*#__PURE__*/ tslFn<ShaderNodeObject<Node>[]>(([v_immutable]) => {
    const v = vec4(v_immutable).toVar();
    const C = vec4(0.138196601125011, 0.276393202250021, 0.414589803375032, -0.447213595499958);
    const i = vec4(floor(v.add(dot(v, vec4(0.309016994374947451))))).toVar();
    const x0 = vec4(v.sub(i).add(dot(i, C.xxxx))).toVar();
    const i0 = vec4().toVar();
    const isX = vec3(step(x0.yzw, x0.xxx)).toVar();
    const isYZ = vec3(step(x0.zww, x0.yyz)).toVar();
    i0.x.assign(isX.x.add(isX.y).add(isX.z));
    i0.yzw.assign(sub(1.0, isX));
    i0.y.addAssign(isYZ.x.add(isYZ.y));
    i0.zw.addAssign(sub(1.0, isYZ.xy));
    i0.z.addAssign(isYZ.z);
    i0.w.addAssign(sub(1.0, isYZ.z));
    const i3 = vec4(clamp(i0, 0.0, 1.0)).toVar();
    const i2 = vec4(clamp(i0.sub(float(1.0)), 0.0, 1.0)).toVar();
    const i1 = vec4(clamp(i0.sub(float(2.0)), 0.0, 1.0)).toVar();
    const x1 = vec4(x0.sub(i1).add(C.xxxx)).toVar();
    const x2 = vec4(x0.sub(i2).add(C.yyyy)).toVar();
    const x3 = vec4(x0.sub(i3).add(C.zzzz)).toVar();
    const x4 = vec4(x0.add(C.wwww)).toVar();
    i.assign(mod289(i));
    const j0 = float(permute(permute(permute(permute(i.w).add(i.z)).add(i.y)).add(i.x))).toVar();
    const j1 = vec4(
        permute(
            permute(
                permute(
                    permute(i.w.add(vec4(i1.w, i2.w, i3.w, 1.0)))
                        .add(i.z)
                        .add(vec4(i1.z, i2.z, i3.z, 1.0)),
                )
                    .add(i.y)
                    .add(vec4(i1.y, i2.y, i3.y, 1.0)),
            )
                .add(i.x)
                .add(vec4(i1.x, i2.x, i3.x, 1.0)),
        ),
    ).toVar();
    const ip = vec4(1.0 / 294.0, 1.0 / 49.0, 1.0 / 7.0, 0.0).toVar();
    const p0 = vec4(grad4(j0, ip)).toVar();
    const p1 = vec4(grad4(j1.x, ip)).toVar();
    const p2 = vec4(grad4(j1.y, ip)).toVar();
    const p3 = vec4(grad4(j1.z, ip)).toVar();
    const p4 = vec4(grad4(j1.w, ip)).toVar();
    const norm = vec4(taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)))).toVar();
    p0.mulAssign(norm.x);
    p1.mulAssign(norm.y);
    p2.mulAssign(norm.z);
    p3.mulAssign(norm.w);
    p4.mulAssign(taylorInvSqrt(dot(p4, p4)));
    const m0 = vec3(max(sub(0.6, vec3(dot(x0, x0), dot(x1, x1), dot(x2, x2))), 0.0)).toVar();
    const m1 = vec2(max(sub(0.6, vec2(dot(x3, x3), dot(x4, x4))), 0.0)).toVar();
    m0.assign(m0.mul(m0));
    m1.assign(m1.mul(m1));

    return mul(
        49.0,
        dot(m0.mul(m0), vec3(dot(p0, x0), dot(p1, x1), dot(p2, x2))).add(
            dot(m1.mul(m1), vec2(dot(p3, x3), dot(p4, x4))),
        ),
    );
}); /* .setLayout({
    name: 'snoise_2',
    type: 'float',
    inputs: [{ name: 'v', type: 'vec4', qualifier: 'in' }],
}) */

// export const snoise = /*#__PURE__*/ overloadingFn([snoise_0, snoise_1, snoise_2]);
export const snoise = /*#__PURE__*/ snoise_1;

export const snoise2 = /*#__PURE__*/ tslFn<ShaderNodeObject<Node>[]>(([x_immutable]) => {
    const x = vec2(x_immutable).toVar();
    const s = float(snoise(vec2(x))).toVar();
    const s1 = float(snoise(vec2(x.y.sub(19.1), x.x.add(47.2)))).toVar();

    return vec2(s, s1);
}); /* .setLayout({
    name: 'snoise2',
    type: 'vec2',
    inputs: [{ name: 'x', type: 'vec2' }],
}) */

export const snoise3_0 = /*#__PURE__*/ tslFn<ShaderNodeObject<Node>[]>(([x_immutable]) => {
    const x = vec3(x_immutable).toVar();
    const s = float(snoise(vec3(x))).toVar();
    const s1 = float(snoise(vec3(x.y.sub(19.1), x.z.add(33.4), x.x.add(47.2)))).toVar();
    const s2 = float(snoise(vec3(x.z.add(74.2), x.x.sub(124.5), x.y.add(99.4)))).toVar();

    return vec3(s, s1, s2);
}); /* .setLayout({
    name: 'snoise3_0',
    type: 'vec3',
    inputs: [{ name: 'x', type: 'vec3' }],
}) */

export const snoise3_1 = /*#__PURE__*/ tslFn<ShaderNodeObject<Node>[]>(([x_immutable]) => {
    const x = vec4(x_immutable).toVar();
    const s = float(snoise(vec4(x))).toVar();
    const s1 = float(snoise(vec4(x.y.sub(19.1), x.z.add(33.4), x.x.add(47.2), x.w))).toVar();
    const s2 = float(snoise(vec4(x.z.add(74.2), x.x.sub(124.5), x.y.add(99.4), x.w))).toVar();

    return vec3(s, s1, s2);
}); /* .setLayout({
    name: 'snoise3_1',
    type: 'vec3',
    inputs: [{ name: 'x', type: 'vec4' }],
}) */

// export const snoise3 = /*#__PURE__*/ overloadingFn([snoise3_0, snoise3_1]);
export const snoise3 = /*#__PURE__*/ snoise3_0;
