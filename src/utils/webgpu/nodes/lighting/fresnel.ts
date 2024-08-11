import { Node, ShaderNodeObject, dot, float, max, tslFn } from 'three/webgpu';

export const createFresnelNode = tslFn<ShaderNodeObject<Node>[]>(([viewDir, normal, power = 1]) => {
    return float(1)
        .sub(max(0, dot(viewDir, normal)))
        .pow(power);
});
