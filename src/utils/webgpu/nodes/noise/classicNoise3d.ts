// @ts-nocheck
// Three.js Transpiler r170
import { Fn, abs, dot, float, floor, fract, mix, mod, mul, step, sub, vec2, vec3, vec4 } from 'three/tsl';

export const permute = /*#__PURE__*/ Fn(([x_immutable]) => {
    const x = vec4(x_immutable).toVar();

    return mod(x.mul(34.0).add(1.0).mul(x), 289.0);
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

export const fade = /*#__PURE__*/ Fn(([t_immutable]) => {
    const t = vec3(t_immutable).toVar();

    return t
        .mul(t)
        .mul(t)
        .mul(t.mul(t.mul(6.0).sub(15.0)).add(10.0));
}).setLayout({
    name: 'fade',
    type: 'vec3',
    inputs: [{ name: 't', type: 'vec3' }],
});

export const cnoise3d = /*#__PURE__*/ Fn<ShaderNodeObject<Node>>(([P_immutable]) => {
    const P = vec3(P_immutable).toVar();
    const Pi0 = vec3(floor(P)).toVar();
    const Pi1 = vec3(Pi0.add(vec3(1.0))).toVar();
    Pi0.assign(mod(Pi0, 289.0));
    Pi1.assign(mod(Pi1, 289.0));
    const Pf0 = vec3(fract(P)).toVar();
    const Pf1 = vec3(Pf0.sub(vec3(1.0))).toVar();
    const ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x).toVar();
    const iy = vec4(Pi0.yy, Pi1.yy).toVar();
    const iz0 = vec4(Pi0.zzzz).toVar();
    const iz1 = vec4(Pi1.zzzz).toVar();
    const ixy = vec4(permute(permute(ix).add(iy))).toVar();
    const ixy0 = vec4(permute(ixy.add(iz0))).toVar();
    const ixy1 = vec4(permute(ixy.add(iz1))).toVar();
    const gx0 = vec4(ixy0.div(7.0)).toVar();
    const gy0 = vec4(fract(floor(gx0).div(7.0)).sub(0.5)).toVar();
    gx0.assign(fract(gx0));
    const gz0 = vec4(vec4(0.5).sub(abs(gx0)).sub(abs(gy0))).toVar();
    const sz0 = vec4(step(gz0, vec4(0.0))).toVar();
    gx0.subAssign(sz0.mul(step(0.0, gx0).sub(0.5)));
    gy0.subAssign(sz0.mul(step(0.0, gy0).sub(0.5)));
    const gx1 = vec4(ixy1.div(7.0)).toVar();
    const gy1 = vec4(fract(floor(gx1).div(7.0)).sub(0.5)).toVar();
    gx1.assign(fract(gx1));
    const gz1 = vec4(vec4(0.5).sub(abs(gx1)).sub(abs(gy1))).toVar();
    const sz1 = vec4(step(gz1, vec4(0.0))).toVar();
    gx1.subAssign(sz1.mul(step(0.0, gx1).sub(0.5)));
    gy1.subAssign(sz1.mul(step(0.0, gy1).sub(0.5)));
    const g000 = vec3(gx0.x, gy0.x, gz0.x).toVar();
    const g100 = vec3(gx0.y, gy0.y, gz0.y).toVar();
    const g010 = vec3(gx0.z, gy0.z, gz0.z).toVar();
    const g110 = vec3(gx0.w, gy0.w, gz0.w).toVar();
    const g001 = vec3(gx1.x, gy1.x, gz1.x).toVar();
    const g101 = vec3(gx1.y, gy1.y, gz1.y).toVar();
    const g011 = vec3(gx1.z, gy1.z, gz1.z).toVar();
    const g111 = vec3(gx1.w, gy1.w, gz1.w).toVar();
    const norm0 = vec4(taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)))).toVar();
    g000.mulAssign(norm0.x);
    g010.mulAssign(norm0.y);
    g100.mulAssign(norm0.z);
    g110.mulAssign(norm0.w);
    const norm1 = vec4(taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)))).toVar();
    g001.mulAssign(norm1.x);
    g011.mulAssign(norm1.y);
    g101.mulAssign(norm1.z);
    g111.mulAssign(norm1.w);
    const n000 = float(dot(g000, Pf0)).toVar();
    const n100 = float(dot(g100, vec3(Pf1.x, Pf0.yz))).toVar();
    const n010 = float(dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z))).toVar();
    const n110 = float(dot(g110, vec3(Pf1.xy, Pf0.z))).toVar();
    const n001 = float(dot(g001, vec3(Pf0.xy, Pf1.z))).toVar();
    const n101 = float(dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z))).toVar();
    const n011 = float(dot(g011, vec3(Pf0.x, Pf1.yz))).toVar();
    const n111 = float(dot(g111, Pf1)).toVar();
    const fade_xyz = vec3(fade(Pf0)).toVar();
    const n_z = vec4(mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z)).toVar();
    const n_yz = vec2(mix(n_z.xy, n_z.zw, fade_xyz.y)).toVar();
    const n_xyz = float(mix(n_yz.x, n_yz.y, fade_xyz.x)).toVar();

    return mul(2.2, n_xyz);
}).setLayout({
    name: 'cnoise',
    type: 'float',
    inputs: [{ name: 'P', type: 'vec3' }],
});
