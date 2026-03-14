import { Fn, abs, float, max, min } from 'three/tsl';
import { ShaderNodeObject } from 'three/tsl';
import { Node } from 'three/webgpu';

export const opSmoothUnion = Fn<ShaderNodeObject<Node>[]>(([d1, d2, k]) => {
    const h = max(k.sub(abs(d1.sub(d2))), float(0)).div(k);
    return min(d1, d2).sub(h.mul(h).mul(k).mul(0.25));
});
