import { convertToTexture, Fn, texture, uniform, uv, vec2 } from 'three/tsl';
import { TempNode, type Node, type Texture } from 'three/webgpu';
import type { TextureSampleNode } from './rgb-shift';

export type FlowmapMotionUvResolver = (vUv: Node<'vec2'>) => Node;

export type FlowmapColorResolver = (
    tex: ReturnType<typeof convertToTexture>,
    vUv: Node<'vec2'>,
    distortion: Node<'vec2'>,
    motion: Node<'vec4'>,
) => Node<'vec4'>;

export type FlowmapCoreParams = {
    power: number;
    resolveMotionUv: FlowmapMotionUvResolver;
    resolveColor: FlowmapColorResolver;
};

export const passThroughUv = /*#__PURE__*/ Fn(([vUv]: [Node<'vec2'>]) => vec2(vUv)).setLayout({
    name: 'passThroughUv',
    type: 'vec2',
    inputs: [{ name: 'vUv', type: 'vec2' }],
});

export const sampleDistorted = /*#__PURE__*/ Fn(
    ([tex, vUv, distortion]: [TextureSampleNode, Node<'vec2'>, Node<'vec2'>]) => tex.sample(vUv.add(distortion)),
).setLayout({
    name: 'sampleDistorted',
    type: 'vec4',
    inputs: [
        { name: 'tex', type: 'vec4' },
        { name: 'vUv', type: 'vec2' },
        { name: 'distortion', type: 'vec2' },
    ],
});

export class FlowmapNode extends TempNode {
    inputNode: ReturnType<typeof convertToTexture>;
    motionTextureNode: ReturnType<typeof texture>;

    power = uniform(0.3);
    resolveMotionUv: FlowmapMotionUvResolver;
    resolveColor: FlowmapColorResolver;

    constructor(inputNode: Node, motionTexture: Texture, params: FlowmapCoreParams) {
        super('vec4');

        this.inputNode = convertToTexture(inputNode);
        this.motionTextureNode = texture(motionTexture);
        this.resolveMotionUv = params.resolveMotionUv;
        this.resolveColor = params.resolveColor;

        this.power.value = params.power;
    }

    setMotionTexture(motionTexture: Texture) {
        this.motionTextureNode.value = motionTexture;
    }

    setup() {
        return Fn(() => {
            const vUv = uv();
            const st = this.resolveMotionUv(vUv);
            const motion = this.motionTextureNode.sample(st);
            const distortion = motion.xy.mul(this.power).mul(-1);

            return this.resolveColor(this.inputNode, vUv, distortion, motion);
        })() as Node<'vec4'>;
    }
}

export function flowmap(inputNode: Node, motionTexture: Texture, params: FlowmapCoreParams) {
    return new FlowmapNode(inputNode, motionTexture, params);
}
