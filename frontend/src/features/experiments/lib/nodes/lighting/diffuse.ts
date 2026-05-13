import { Fn, dot, float, max } from 'three/tsl';
import type { Node } from 'three/webgpu';

export const diffuseNode = Fn(([lightColor, lightDir, normal]: [Node<'vec3'>, Node<'vec3'>, Node<'vec3'>]) => {
    const dp = max(float(0), dot(lightDir, normal));

    return dp.mul(lightColor);
});
