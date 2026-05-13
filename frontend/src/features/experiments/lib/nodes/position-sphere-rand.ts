/* eslint-disable */
import { Fn, float, hash, instanceIndex, normalize, pow, vec3 } from 'three/tsl';
import type { Node, NodeBuilder } from 'three/webgpu';

export const positionSphereRand = /*#__PURE__*/ Fn(([radius_immutable]: [Node<'float'>], _builder: NodeBuilder) => {
    const radius = float(radius_immutable).toVar();
    const u = vec3(hash(instanceIndex.mul(3)), hash(instanceIndex.mul(3).add(1)), hash(instanceIndex.mul(3).add(2)))
        .mul(2)
        .sub(1);
    const dir = normalize(u).toVar();
    const rnd = hash(instanceIndex.add(999)).toVar();
    const r = radius.mul(pow(rnd, float(1 / 3)));

    return dir.mul(r);
}).setLayout({
    name: 'positionSphereRand',
    type: 'vec3',
    inputs: [{ name: 'radius', type: 'float' }],
});
