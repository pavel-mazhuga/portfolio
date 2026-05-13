import { select, texture, vec2, vec4 } from 'three/tsl';
import type { Node, UniformNode } from 'three/webgpu';
import type { HexGridVideoSlotTexture } from '../types';

export function buildVideoSizeVec2(
    widthUniforms: UniformNode<'float', number>[],
    heightUniforms: UniformNode<'float', number>[],
    indexNode: Node<'float'>,
): Node<'vec2'> {
    let node: Node<'vec2'> = vec2(1);

    for (let j = widthUniforms.length - 1; j >= 0; j--) {
        const w = widthUniforms[j];
        const h = heightUniforms[j];

        if (w === undefined || h === undefined) {
            continue;
        }

        node = select(indexNode.equal(j), vec2(w, h), node);
    }

    return node;
}

export function buildVideoTextureNode(
    videoTextures: HexGridVideoSlotTexture[],
    indexNode: Node<'float'>,
    uvMap: Node<'vec2'>,
): Node<'vec4'> {
    let node: Node<'vec4'> = vec4(0, 0, 0, 1);

    for (let j = videoTextures.length - 1; j >= 0; j--) {
        const tex = videoTextures[j];

        if (tex === undefined) {
            continue;
        }

        node = select(indexNode.equal(j), texture(tex, uvMap), node);
    }

    return node;
}
