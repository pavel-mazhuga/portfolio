import { Fn, ShaderNodeObject, dot, max } from 'three/tsl';
import { Node } from 'three/webgpu';

export const diffuseNode = Fn<[ShaderNodeObject<Node>, ShaderNodeObject<Node>, ShaderNodeObject<Node>]>(
    ([lightColor, lightDir, normal]) => {
        const dp = max(0, dot(lightDir, normal));
        return dp.mul(lightColor);
    },
);
