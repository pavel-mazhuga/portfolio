import { Fn, clamp, float, mix, mul, smoothstep, sub, uv, vec4 } from 'three/tsl';
import type { Node, TextureNode } from 'three/webgpu';
import { coverTextureUv } from '../../../canvas/utils/tsl/uv-cover';

export type ColorInputs = {
    planeSize: Node<'vec2'>;
    currentTexture: TextureNode;
    currentTextureNaturalSize: Node<'vec2'>;
    nextTexture: TextureNode;
    nextTextureNaturalSize: Node<'vec2'>;
    progress: Node<'float'>;
};

export const colorNode = Fn((inputs: ColorInputs) => {
    const { planeSize, currentTexture, currentTextureNaturalSize, nextTexture, nextTextureNaturalSize, progress } =
        inputs;

    const coveredUv = mix(
        coverTextureUv(currentTextureNaturalSize, planeSize, uv()),
        coverTextureUv(nextTextureNaturalSize, planeSize, uv()),
        progress,
    );

    const distortion = float(smoothstep(0, 1, float(progress).mul(2).add(coveredUv.x.sub(1)))).toVar();

    const currentImage = vec4(currentTexture.sample(coveredUv.sub(mul(0.5, sub(1, distortion))).add(0.5))).toVar();

    const nextImage = vec4(nextTexture.sample(coveredUv.sub(mul(0.5, distortion)).add(0.5))).toVar();

    return vec4(mix(currentImage, nextImage, clamp(distortion, 0, 1)));
});
