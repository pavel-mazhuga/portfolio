// Three.js Transpiler r174
import { Fn } from 'three/tsl';
import { int, mat3, mat4, vec3 } from 'three/tsl';

export const compose = /*#__PURE__*/ Fn<any>(([pos_immutable, rmat_immutable, scale_immutable]) => {
    const scale = vec3(scale_immutable).toVar();
    const rmat = mat3(rmat_immutable).toVar();
    const pos = vec3(pos_immutable).toVar();

    return mat4(
        rmat.element(int(0)).element(int(0)).mul(scale.x),
        rmat.element(int(0)).element(int(1)).mul(scale.x),
        rmat.element(int(0)).element(int(2)).mul(scale.x),
        0.0,
        rmat.element(int(1)).element(int(0)).mul(scale.y),
        rmat.element(int(1)).element(int(1)).mul(scale.y),
        rmat.element(int(1)).element(int(2)).mul(scale.y),
        0.0,
        rmat.element(int(2)).element(int(0)).mul(scale.z),
        rmat.element(int(2)).element(int(1)).mul(scale.z),
        rmat.element(int(2)).element(int(2)).mul(scale.z),
        0.0,
        pos.x,
        pos.y,
        pos.z,
        1.0,
    );
}).setLayout({
    name: 'compose',
    type: 'mat4',
    inputs: [
        { name: 'pos', type: 'vec3' },
        { name: 'rmat', type: 'mat3' },
        { name: 'scale', type: 'vec3' },
    ],
});
