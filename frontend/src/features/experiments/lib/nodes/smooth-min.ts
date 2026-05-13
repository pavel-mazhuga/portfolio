import { Fn, abs, float, max, min } from 'three/tsl';
import type { Node } from 'three/webgpu';

export const smoothmin = Fn(([a, b, k]: [Node<'float'>, Node<'float'>, Node<'float'>]) => {
    const h = max(k.sub(abs(a.sub(b))), float(0)).div(k);

    return min(a, b).sub(h.mul(h).mul(k).mul(0.25));
});
