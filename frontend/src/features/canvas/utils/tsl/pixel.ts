import { floor, Fn, vec2 } from 'three/tsl';
import type { Node } from 'three/webgpu';

export const quantizeUv = /*#__PURE__*/ Fn(([vUv, aspect, pixelSize]: [Node<'vec2'>, Node<'float'>, Node<'float'>]) => {
    const pixel = vec2(aspect.mul(pixelSize), pixelSize).toVar();

    return floor(vUv.mul(pixel)).div(pixel);
}).setLayout({
    name: 'quantizeUv',
    type: 'vec2',
    inputs: [
        { name: 'vUv', type: 'vec2' },
        { name: 'aspect', type: 'float' },
        { name: 'pixel', type: 'float' },
    ],
});
