// @ts-nocheck
import { Fn, cos, float, mat3, sin } from 'three/tsl';

export const rotate3dY = /*#__PURE__*/ Fn<[ShaderNodeObject<Node>]>(([angle]) => {
    const s = float(sin(angle)).toVar();
    const c = float(cos(angle)).toVar();
    return mat3(c, 0.0, s.negate(), 0.0, 1.0, 0.0, s, 0.0, c);
}).setLayout({
    name: 'rotate3dY',
    type: 'mat3',
    inputs: [{ name: 'angle', type: 'float' }],
});
