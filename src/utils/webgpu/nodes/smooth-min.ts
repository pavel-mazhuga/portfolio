import { Fn, ShaderNodeObject, abs, max, min } from 'three/tsl';
import { Node } from 'three/webgpu';

export const smoothmin = Fn<ShaderNodeObject<Node>[]>(([a, b, k]) => {
    const h = max(k.sub(abs(a.sub(b))), 0).div(k);
    return min(a, b).sub(h.mul(h).mul(k).mul(0.25));
});
