// @ts-nocheck
// Three.js Transpiler r171
import { Fn, cos, float, mat3, sin, vec3 } from 'three/tsl';

export const rotateY = /*#__PURE__*/ Fn<[any, any]>(([position_immutable, angle_immutable]) => {
    const angle = float(angle_immutable).toVar();
    const position = vec3(position_immutable).toVar();
    const s = float(sin(angle)).toVar();
    const c = float(cos(angle)).toVar();

    const rotationMatrix = mat3(vec3(c, 0.0, s), vec3(0.0, 1.0, 0.0), vec3(s.negate(), 0.0, c));

    return rotationMatrix.mul(position);
}).setLayout({
    name: 'rotateY',
    type: 'vec3',
    inputs: [
        { name: 'position', type: 'vec3' },
        { name: 'angle', type: 'float' },
    ],
});
