import { Node, ShaderNodeObject, abs, max, min, tslFn } from 'three/webgpu';

export const smoothmin = tslFn<ShaderNodeObject<Node>[]>(([a, b, k]) => {
    const h = max(k.sub(abs(a.sub(b))), 0).div(k);
    return min(a, b).sub(h.mul(h).mul(k).mul(0.25));
});
