import { Fn, Node, ShaderNodeObject, TextureNode, clamp, float, mix, mul, smoothstep, sub, uv, vec4 } from 'three/tsl';
import { coverTextureUv } from '@/app/tsl-utils/image/uv-cover';

export const colorNode = Fn<{
    planeSize: ShaderNodeObject<Node>;
    currentTexture: ShaderNodeObject<TextureNode>;
    currentTextureNaturalSize: ShaderNodeObject<Node>;
    nextTexture: ShaderNodeObject<TextureNode>;
    nextTextureNaturalSize: ShaderNodeObject<Node>;
    progress: ShaderNodeObject<Node> | number;
}>(({ currentTexture, currentTextureNaturalSize, nextTexture, nextTextureNaturalSize, planeSize, progress }) => {
    const coveredUv = mix(
        coverTextureUv(currentTextureNaturalSize, planeSize, uv()),
        coverTextureUv(nextTextureNaturalSize, planeSize, uv()),
        progress,
    );

    const distortion = float(smoothstep(0, 1, float(progress).mul(2).add(coveredUv.x.sub(1)))).toVar();

    const currentImage = vec4(currentTexture.uv(coveredUv.sub(mul(0.5, sub(1, distortion))).add(0.5))).toVar();

    const nextImage = vec4(nextTexture.uv(coveredUv.sub(mul(0.5, distortion)).add(0.5))).toVar();

    return vec4(mix(currentImage, nextImage, clamp(0, 1, distortion)));
});
