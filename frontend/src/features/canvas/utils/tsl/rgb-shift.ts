import { Fn, vec4 } from 'three/tsl';
import type { Node } from 'three/webgpu';

export type TextureSampleNode = {
    sample: (uv: Node<'vec2'>) => Node<'vec4'>;
};

export const sampleRgbShift = /*#__PURE__*/ Fn(
    ([texture, uv, distortion]: [TextureSampleNode, Node<'vec2'>, Node<'vec2'>]) => {
        const distorted = uv.add(distortion).toVar();

        return vec4(
            texture.sample(uv.add(distortion.mul(0.5))).r,
            texture.sample(uv.add(distortion.mul(0.75))).g,
            texture.sample(distorted).b,
            texture.sample(distorted).a,
        );
    },
).setLayout({
    name: 'sampleRgbShift',
    type: 'vec4',
    inputs: [
        { name: 'tex', type: 'vec4' },
        { name: 'uv', type: 'vec2' },
        { name: 'distortion', type: 'vec2' },
    ],
});
