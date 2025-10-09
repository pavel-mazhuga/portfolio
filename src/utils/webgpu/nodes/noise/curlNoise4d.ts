// @ts-nocheck
// Three.js Transpiler r172
import { Fn, div, float, mul, normalize, vec3, vec4 } from 'three/tsl';
import { simplexNoise3d as snoise3 } from './simplexNoise3d';

export const curlNoise4d = /*#__PURE__*/ Fn<ShaderNodeObject<Node>>(([p_immutable]) => {
    const p = vec4(p_immutable).toVar();
    const e = float(0.1);
    const dx = vec4(e, 0.0, 0.0, 1.0).toVar();
    const dy = vec4(0.0, e, 0.0, 1.0).toVar();
    const dz = vec4(0.0, 0.0, e, 1.0).toVar();
    const p_x0 = vec3(snoise3(p.sub(dx))).toVar();
    const p_x1 = vec3(snoise3(p.add(dx))).toVar();
    const p_y0 = vec3(snoise3(p.sub(dy))).toVar();
    const p_y1 = vec3(snoise3(p.add(dy))).toVar();
    const p_z0 = vec3(snoise3(p.sub(dz))).toVar();
    const p_z1 = vec3(snoise3(p.add(dz))).toVar();
    const x = float(p_y1.z.sub(p_y0.z).sub(p_z1.y).add(p_z0.y)).toVar();
    const y = float(p_z1.x.sub(p_z0.x).sub(p_x1.z).add(p_x0.z)).toVar();
    const z = float(p_x1.y.sub(p_x0.y).sub(p_y1.x).add(p_y0.x)).toVar();
    const divisor = float(div(1.0, mul(2.0, e)));
    return normalize(vec3(x, y, z).mul(divisor));
}).setLayout({
    name: 'curl',
    type: 'vec3',
    inputs: [{ name: 'p', type: 'vec4' }],
});
