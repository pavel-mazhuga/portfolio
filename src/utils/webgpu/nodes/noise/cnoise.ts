// Three.js Transpiler r167
import {
    Node,
    ShaderNodeObject,
    abs,
    dot,
    float,
    floor,
    fract,
    mix,
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

export const quintic_0 = /*#__PURE__*/ tslFn(([v]) => {
    return v
        .mul(v)
        .mul(v)
        .mul(v.mul(v.mul(6.0).sub(15.0)).add(10.0));
}); /* .setLayout({
    name: 'quintic_0',
    type: 'float',
    inputs: [{ name: 'v', type: 'float', qualifier: 'in' }],
}) */

export const quintic_1 = /*#__PURE__*/ tslFn(([v]) => {
    return v
        .mul(v)
        .mul(v)
        .mul(v.mul(v.mul(6.0).sub(15.0)).add(10.0));
}); /* .setLayout({
    name: 'quintic_1',
    type: 'vec2',
    inputs: [{ name: 'v', type: 'vec2', qualifier: 'in' }],
}) */

export const quintic_2 = /*#__PURE__*/ tslFn(([v]) => {
    return v
        .mul(v)
        .mul(v)
        .mul(v.mul(v.mul(6.0).sub(15.0)).add(10.0));
}); /* .setLayout({
    name: 'quintic_2',
    type: 'vec3',
    inputs: [{ name: 'v', type: 'vec3', qualifier: 'in' }],
}) */

export const quintic_3 = /*#__PURE__*/ tslFn(([v]) => {
    return v
        .mul(v)
        .mul(v)
        .mul(v.mul(v.mul(6.0).sub(15.0)).add(10.0));
}); /* .setLayout({
    name: 'quintic_3',
    type: 'vec4',
    inputs: [{ name: 'v', type: 'vec4', qualifier: 'in' }],
}) */

// export const quintic = /*#__PURE__*/ overloadingFn([quintic_0, quintic_1, quintic_2, quintic_3]);
export const quintic = /*#__PURE__*/ quintic_2;

export const cnoise_0 = /*#__PURE__*/ tslFn(([P_immutable]) => {
    const P = vec2(P_immutable).toVar();
    const Pi = vec4(floor(P.xyxy).add(vec4(0.0, 0.0, 1.0, 1.0))).toVar();
    const Pf = vec4(fract(P.xyxy).sub(vec4(0.0, 0.0, 1.0, 1.0))).toVar();
    Pi.assign(mod289(Pi));
    const ix = vec4(Pi.xzxz).toVar();
    const iy = vec4(Pi.yyww).toVar();
    const fx = vec4(Pf.xzxz).toVar();
    const fy = vec4(Pf.yyww).toVar();
    const i = vec4(permute(permute(ix).add(iy))).toVar();
    const gx = vec4(
        fract(i.mul(1.0 / 41.0))
            .mul(2.0)
            .sub(1.0),
    ).toVar();
    const gy = vec4(abs(gx).sub(0.5)).toVar();
    const tx = vec4(floor(gx.add(0.5))).toVar();
    gx.assign(gx.sub(tx));
    const g00 = vec2(gx.x, gy.x).toVar();
    const g10 = vec2(gx.y, gy.y).toVar();
    const g01 = vec2(gx.z, gy.z).toVar();
    const g11 = vec2(gx.w, gy.w).toVar();
    const norm = vec4(taylorInvSqrt(vec4(dot(g00, g00), dot(g01, g01), dot(g10, g10), dot(g11, g11)))).toVar();
    g00.mulAssign(norm.x);
    g01.mulAssign(norm.y);
    g10.mulAssign(norm.z);
    g11.mulAssign(norm.w);
    const n00 = float(dot(g00, vec2(fx.x, fy.x))).toVar();
    const n10 = float(dot(g10, vec2(fx.y, fy.y))).toVar();
    const n01 = float(dot(g01, vec2(fx.z, fy.z))).toVar();
    const n11 = float(dot(g11, vec2(fx.w, fy.w))).toVar();
    const fade_xy = vec2(quintic(Pf.xy)).toVar();
    const n_x = vec2(mix(vec2(n00, n01), vec2(n10, n11), fade_xy.x)).toVar();
    const n_xy = float(mix(n_x.x, n_x.y, fade_xy.y)).toVar();

    return mul(2.3, n_xy);
}); /* .setLayout({
    name: 'cnoise_0',
    type: 'float',
    inputs: [{ name: 'P', type: 'vec2', qualifier: 'in' }],
}) */

export const cnoise_1 = /*#__PURE__*/ tslFn(([P_immutable]) => {
    const P = vec3(P_immutable).toVar();
    const Pi0 = vec3(floor(P)).toVar();
    const Pi1 = vec3(Pi0.add(vec3(1.0))).toVar();
    Pi0.assign(mod289(Pi0));
    Pi1.assign(mod289(Pi1));
    const Pf0 = vec3(fract(P)).toVar();
    const Pf1 = vec3(Pf0.sub(vec3(1.0))).toVar();
    const ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x).toVar();
    const iy = vec4(Pi0.yy, Pi1.yy).toVar();
    const iz0 = vec4(Pi0.zzzz).toVar();
    const iz1 = vec4(Pi1.zzzz).toVar();
    const ixy = vec4(permute(permute(ix).add(iy))).toVar();
    const ixy0 = vec4(permute(ixy.add(iz0))).toVar();
    const ixy1 = vec4(permute(ixy.add(iz1))).toVar();
    const gx0 = vec4(ixy0.mul(1.0 / 7.0)).toVar();
    const gy0 = vec4(fract(floor(gx0).mul(1.0 / 7.0)).sub(0.5)).toVar();
    gx0.assign(fract(gx0));
    const gz0 = vec4(vec4(0.5).sub(abs(gx0)).sub(abs(gy0))).toVar();
    const sz0 = vec4(step(gz0, vec4(0.0))).toVar();
    gx0.subAssign(sz0.mul(step(0.0, gx0).sub(0.5)));
    gy0.subAssign(sz0.mul(step(0.0, gy0).sub(0.5)));
    const gx1 = vec4(ixy1.mul(1.0 / 7.0)).toVar();
    const gy1 = vec4(fract(floor(gx1).mul(1.0 / 7.0)).sub(0.5)).toVar();
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
    const fade_xyz = vec3(quintic(Pf0)).toVar();
    const n_z = vec4(mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z)).toVar();
    const n_yz = vec2(mix(n_z.xy, n_z.zw, fade_xyz.y)).toVar();
    const n_xyz = float(mix(n_yz.x, n_yz.y, fade_xyz.x)).toVar();

    return mul(2.2, n_xyz);
}); /* .setLayout({
    name: 'cnoise_1',
    type: 'float',
    inputs: [{ name: 'P', type: 'vec3', qualifier: 'in' }],
}) */

export const cnoise_2 = /*#__PURE__*/ tslFn(([P_immutable]) => {
    const P = vec4(P_immutable).toVar();
    const Pi0 = vec4(floor(P)).toVar();
    const Pi1 = vec4(Pi0.add(1.0)).toVar();
    Pi0.assign(mod289(Pi0));
    Pi1.assign(mod289(Pi1));
    const Pf0 = vec4(fract(P)).toVar();
    const Pf1 = vec4(Pf0.sub(1.0)).toVar();
    const ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x).toVar();
    const iy = vec4(Pi0.yy, Pi1.yy).toVar();
    const iz0 = vec4(Pi0.zzzz).toVar();
    const iz1 = vec4(Pi1.zzzz).toVar();
    const iw0 = vec4(Pi0.wwww).toVar();
    const iw1 = vec4(Pi1.wwww).toVar();
    const ixy = vec4(permute(permute(ix).add(iy))).toVar();
    const ixy0 = vec4(permute(ixy.add(iz0))).toVar();
    const ixy1 = vec4(permute(ixy.add(iz1))).toVar();
    const ixy00 = vec4(permute(ixy0.add(iw0))).toVar();
    const ixy01 = vec4(permute(ixy0.add(iw1))).toVar();
    const ixy10 = vec4(permute(ixy1.add(iw0))).toVar();
    const ixy11 = vec4(permute(ixy1.add(iw1))).toVar();
    const gx00 = vec4(ixy00.mul(1.0 / 7.0)).toVar();
    const gy00 = vec4(floor(gx00).mul(1.0 / 7.0)).toVar();
    const gz00 = vec4(floor(gy00).mul(1.0 / 6.0)).toVar();
    gx00.assign(fract(gx00).sub(0.5));
    gy00.assign(fract(gy00).sub(0.5));
    gz00.assign(fract(gz00).sub(0.5));
    const gw00 = vec4(vec4(0.75).sub(abs(gx00)).sub(abs(gy00)).sub(abs(gz00))).toVar();
    const sw00 = vec4(step(gw00, vec4(0.0))).toVar();
    gx00.subAssign(sw00.mul(step(0.0, gx00).sub(0.5)));
    gy00.subAssign(sw00.mul(step(0.0, gy00).sub(0.5)));
    const gx01 = vec4(ixy01.mul(1.0 / 7.0)).toVar();
    const gy01 = vec4(floor(gx01).mul(1.0 / 7.0)).toVar();
    const gz01 = vec4(floor(gy01).mul(1.0 / 6.0)).toVar();
    gx01.assign(fract(gx01).sub(0.5));
    gy01.assign(fract(gy01).sub(0.5));
    gz01.assign(fract(gz01).sub(0.5));
    const gw01 = vec4(vec4(0.75).sub(abs(gx01)).sub(abs(gy01)).sub(abs(gz01))).toVar();
    const sw01 = vec4(step(gw01, vec4(0.0))).toVar();
    gx01.subAssign(sw01.mul(step(0.0, gx01).sub(0.5)));
    gy01.subAssign(sw01.mul(step(0.0, gy01).sub(0.5)));
    const gx10 = vec4(ixy10.mul(1.0 / 7.0)).toVar();
    const gy10 = vec4(floor(gx10).mul(1.0 / 7.0)).toVar();
    const gz10 = vec4(floor(gy10).mul(1.0 / 6.0)).toVar();
    gx10.assign(fract(gx10).sub(0.5));
    gy10.assign(fract(gy10).sub(0.5));
    gz10.assign(fract(gz10).sub(0.5));
    const gw10 = vec4(vec4(0.75).sub(abs(gx10)).sub(abs(gy10)).sub(abs(gz10))).toVar();
    const sw10 = vec4(step(gw10, vec4(0.0))).toVar();
    gx10.subAssign(sw10.mul(step(0.0, gx10).sub(0.5)));
    gy10.subAssign(sw10.mul(step(0.0, gy10).sub(0.5)));
    const gx11 = vec4(ixy11.mul(1.0 / 7.0)).toVar();
    const gy11 = vec4(floor(gx11).mul(1.0 / 7.0)).toVar();
    const gz11 = vec4(floor(gy11).mul(1.0 / 6.0)).toVar();
    gx11.assign(fract(gx11).sub(0.5));
    gy11.assign(fract(gy11).sub(0.5));
    gz11.assign(fract(gz11).sub(0.5));
    const gw11 = vec4(vec4(0.75).sub(abs(gx11)).sub(abs(gy11)).sub(abs(gz11))).toVar();
    const sw11 = vec4(step(gw11, vec4(0.0))).toVar();
    gx11.subAssign(sw11.mul(step(0.0, gx11).sub(0.5)));
    gy11.subAssign(sw11.mul(step(0.0, gy11).sub(0.5)));
    const g0000 = vec4(gx00.x, gy00.x, gz00.x, gw00.x).toVar();
    const g1000 = vec4(gx00.y, gy00.y, gz00.y, gw00.y).toVar();
    const g0100 = vec4(gx00.z, gy00.z, gz00.z, gw00.z).toVar();
    const g1100 = vec4(gx00.w, gy00.w, gz00.w, gw00.w).toVar();
    const g0010 = vec4(gx10.x, gy10.x, gz10.x, gw10.x).toVar();
    const g1010 = vec4(gx10.y, gy10.y, gz10.y, gw10.y).toVar();
    const g0110 = vec4(gx10.z, gy10.z, gz10.z, gw10.z).toVar();
    const g1110 = vec4(gx10.w, gy10.w, gz10.w, gw10.w).toVar();
    const g0001 = vec4(gx01.x, gy01.x, gz01.x, gw01.x).toVar();
    const g1001 = vec4(gx01.y, gy01.y, gz01.y, gw01.y).toVar();
    const g0101 = vec4(gx01.z, gy01.z, gz01.z, gw01.z).toVar();
    const g1101 = vec4(gx01.w, gy01.w, gz01.w, gw01.w).toVar();
    const g0011 = vec4(gx11.x, gy11.x, gz11.x, gw11.x).toVar();
    const g1011 = vec4(gx11.y, gy11.y, gz11.y, gw11.y).toVar();
    const g0111 = vec4(gx11.z, gy11.z, gz11.z, gw11.z).toVar();
    const g1111 = vec4(gx11.w, gy11.w, gz11.w, gw11.w).toVar();
    const norm00 = vec4(
        taylorInvSqrt(vec4(dot(g0000, g0000), dot(g0100, g0100), dot(g1000, g1000), dot(g1100, g1100))),
    ).toVar();
    g0000.mulAssign(norm00.x);
    g0100.mulAssign(norm00.y);
    g1000.mulAssign(norm00.z);
    g1100.mulAssign(norm00.w);
    const norm01 = vec4(
        taylorInvSqrt(vec4(dot(g0001, g0001), dot(g0101, g0101), dot(g1001, g1001), dot(g1101, g1101))),
    ).toVar();
    g0001.mulAssign(norm01.x);
    g0101.mulAssign(norm01.y);
    g1001.mulAssign(norm01.z);
    g1101.mulAssign(norm01.w);
    const norm10 = vec4(
        taylorInvSqrt(vec4(dot(g0010, g0010), dot(g0110, g0110), dot(g1010, g1010), dot(g1110, g1110))),
    ).toVar();
    g0010.mulAssign(norm10.x);
    g0110.mulAssign(norm10.y);
    g1010.mulAssign(norm10.z);
    g1110.mulAssign(norm10.w);
    const norm11 = vec4(
        taylorInvSqrt(vec4(dot(g0011, g0011), dot(g0111, g0111), dot(g1011, g1011), dot(g1111, g1111))),
    ).toVar();
    g0011.mulAssign(norm11.x);
    g0111.mulAssign(norm11.y);
    g1011.mulAssign(norm11.z);
    g1111.mulAssign(norm11.w);
    const n0000 = float(dot(g0000, Pf0)).toVar();
    const n1000 = float(dot(g1000, vec4(Pf1.x, Pf0.yzw))).toVar();
    const n0100 = float(dot(g0100, vec4(Pf0.x, Pf1.y, Pf0.zw))).toVar();
    const n1100 = float(dot(g1100, vec4(Pf1.xy, Pf0.zw))).toVar();
    const n0010 = float(dot(g0010, vec4(Pf0.xy, Pf1.z, Pf0.w))).toVar();
    const n1010 = float(dot(g1010, vec4(Pf1.x, Pf0.y, Pf1.z, Pf0.w))).toVar();
    const n0110 = float(dot(g0110, vec4(Pf0.x, Pf1.yz, Pf0.w))).toVar();
    const n1110 = float(dot(g1110, vec4(Pf1.xyz, Pf0.w))).toVar();
    const n0001 = float(dot(g0001, vec4(Pf0.xyz, Pf1.w))).toVar();
    const n1001 = float(dot(g1001, vec4(Pf1.x, Pf0.yz, Pf1.w))).toVar();
    const n0101 = float(dot(g0101, vec4(Pf0.x, Pf1.y, Pf0.z, Pf1.w))).toVar();
    const n1101 = float(dot(g1101, vec4(Pf1.xy, Pf0.z, Pf1.w))).toVar();
    const n0011 = float(dot(g0011, vec4(Pf0.xy, Pf1.zw))).toVar();
    const n1011 = float(dot(g1011, vec4(Pf1.x, Pf0.y, Pf1.zw))).toVar();
    const n0111 = float(dot(g0111, vec4(Pf0.x, Pf1.yzw))).toVar();
    const n1111 = float(dot(g1111, Pf1)).toVar();
    const fade_xyzw = vec4(quintic(Pf0)).toVar();
    const n_0w = vec4(mix(vec4(n0000, n1000, n0100, n1100), vec4(n0001, n1001, n0101, n1101), fade_xyzw.w)).toVar();
    const n_1w = vec4(mix(vec4(n0010, n1010, n0110, n1110), vec4(n0011, n1011, n0111, n1111), fade_xyzw.w)).toVar();
    const n_zw = vec4(mix(n_0w, n_1w, fade_xyzw.z)).toVar();
    const n_yzw = vec2(mix(n_zw.xy, n_zw.zw, fade_xyzw.y)).toVar();
    const n_xyzw = float(mix(n_yzw.x, n_yzw.y, fade_xyzw.x)).toVar();

    return mul(2.2, n_xyzw);
}); /* .setLayout({
    name: 'cnoise_2',
    type: 'float',
    inputs: [{ name: 'P', type: 'vec4', qualifier: 'in' }],
}) */

// export const cnoise = /*#__PURE__*/ overloadingFn([cnoise_0, cnoise_1, cnoise_2]);
export const cnoise = /*#__PURE__*/ cnoise_1;
