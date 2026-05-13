/* eslint-disable */
import { Fn, cos, float, mat3, sin, vec3 } from 'three/tsl';
import type { Node, NodeBuilder } from 'three/webgpu';

export const rotationXYZ = /*#__PURE__*/ Fn(([euler_immutable]: [Node<'vec3'>], _builder: NodeBuilder) => {
    const e = vec3(euler_immutable).toVar();
    const x = float(e.x);
    const y = float(e.y);
    const z = float(e.z);
    const cx = cos(x).toVar();
    const sx = sin(x).toVar();
    const cy = cos(y).toVar();
    const sy = sin(y).toVar();
    const cz = cos(z).toVar();
    const sz = sin(z).toVar();

    const rx = mat3(1, 0, 0, 0, cx, sx.negate(), 0, sx, cx);
    const ry = mat3(cy, 0, sy.negate(), 0, 1, 0, sy, 0, cy);
    const rz = mat3(cz, sz.negate(), 0, sz, cz, 0, 0, 0, 1);

    return rz.mul(ry).mul(rx);
}).setLayout({
    name: 'rotationXYZ',
    type: 'mat3',
    inputs: [{ name: 'euler', type: 'vec3' }],
});
