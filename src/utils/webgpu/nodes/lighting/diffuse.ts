import { Node, ShaderNodeObject, dot, max, tslFn } from 'three/webgpu';

export const diffuseNode = tslFn<[ShaderNodeObject<Node>, ShaderNodeObject<Node>, ShaderNodeObject<Node>]>(
    ([lightColor, lightDir, normal]) => {
        const dp = max(0, dot(lightDir, normal));
        return dp.mul(lightColor);
    },
);
