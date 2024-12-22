// @ts-nocheck
// Three.js Transpiler r171
import { Fn, cos, float, mat3, sin, vec3 } from 'three/tsl';

export const rotateZ = /*#__PURE__*/ Fn(([position_immutable, angle_immutable]) => {
    const angle = float(angle_immutable).toVar();
    const position = vec3(position_immutable).toVar();
    const c = float(cos(angle)).toVar();
    const s = float(sin(angle)).toVar();

    const rotationMatrix = mat3(c, s.negate(), 0.0, s, c, 0.0, 0.0, 0.0, 1.0);

    return rotationMatrix.mul(position);
}).setLayout({
    name: 'rotateZ',
    type: 'vec3',
    inputs: [
        { name: 'position', type: 'vec3' },
        { name: 'angle', type: 'float' },
    ],
});
