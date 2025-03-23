// Three.js Transpiler r174
import { Fn } from 'three/tsl';
import { ShaderNodeObject, cos, float, mat3, sin, vec3 } from 'three/tsl';
import { Node } from 'three/webgpu';

export const rotationXYZ = /*#__PURE__*/ Fn<[ShaderNodeObject<Node>]>(([euler_immutable]) => {
    const euler = vec3(euler_immutable).toVar();
    const a = float(cos(euler.x)).toVar();
    const b = float(sin(euler.x)).toVar();
    const c = float(cos(euler.y)).toVar();
    const d = float(sin(euler.y)).toVar();
    const e = float(cos(euler.z)).toVar();
    const f = float(sin(euler.z)).toVar();
    const ae = float(a.mul(e)).toVar();
    const af = float(a.mul(f)).toVar();
    const be = float(b.mul(e)).toVar();
    const bf = float(b.mul(f)).toVar();

    return mat3(
        vec3(c.mul(e), af.add(be.mul(d)), bf.sub(ae.mul(d))),
        vec3(c.negate().mul(f), ae.sub(bf.mul(d)), be.add(af.mul(d))),
        vec3(d, b.negate().mul(c), a.mul(c)),
    );
}).setLayout({
    name: 'rotationXYZ',
    type: 'mat3',
    inputs: [{ name: 'euler', type: 'vec3' }],
});
