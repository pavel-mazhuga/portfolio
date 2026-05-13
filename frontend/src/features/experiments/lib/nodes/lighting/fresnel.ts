import { Fn, dot, float, max } from 'three/tsl';
import type { Node } from 'three/webgpu';

export const createFresnelNode = Fn(([viewDir, normal, power]: [Node<'vec3'>, Node<'vec3'>, Node<'float'>]) => {
    return float(1)
        .sub(max(0, dot(viewDir, normal)))
        .pow(power);
});
