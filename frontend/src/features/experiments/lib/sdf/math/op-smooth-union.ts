import { Fn, abs, float, max, min } from 'three/tsl';
import type { Node } from 'three/webgpu';

export const opSmoothUnion = Fn(([d1, d2, k]: [Node<'float'>, Node<'float'>, Node<'float'>]) => {
    const h = max(k.sub(abs(d1.sub(d2))), float(0)).div(k);

    return min(d1, d2).sub(h.mul(h).mul(k).mul(0.25));
});
