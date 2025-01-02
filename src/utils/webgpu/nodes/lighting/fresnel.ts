import { Fn, ShaderNodeObject, dot, float, max } from 'three/tsl';
import { Node } from 'three/webgpu';

export const createFresnelNode = Fn<ShaderNodeObject<Node>[]>(([viewDir, normal, power = 1]) => {
    return float(1)
        .sub(max(0, dot(viewDir, normal)))
        .pow(power);
});
