import { Fn } from 'three/tsl';
import type { Node } from 'three/webgpu';

export const sdSphere = Fn(([p, r]: [Node<'vec3'>, Node<'float'>]) => {
    return p.length().sub(r);
}).setLayout({
    name: 'sdSphere',
    type: 'float',
    inputs: [
        { name: 'p', type: 'vec3' },
        { name: 'r', type: 'float' },
    ],
});
