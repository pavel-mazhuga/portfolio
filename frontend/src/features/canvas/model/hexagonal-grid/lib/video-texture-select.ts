import { color, float, select, texture, vec2 } from 'three/tsl';
import type { VideoTexture } from 'three/webgpu';

export function buildVideoSizeVec2(widthUniforms: any[], heightUniforms: any[], indexNode: any): any {
    let node: any = vec2(float(1), float(1)) as any;

    for (let j = widthUniforms.length - 1; j >= 0; j--) {
        node = select(indexNode.equal(j), vec2(widthUniforms[j], heightUniforms[j]) as any, node) as any;
    }

    return node;
}

export function buildVideoTextureNode(videoTextures: VideoTexture[], indexNode: any, uvMap: any): any {
    let node: any = color(0x000000);

    for (let j = videoTextures.length - 1; j >= 0; j--) {
        node = (select as any)(indexNode.equal(j), texture(videoTextures[j], uvMap), node);
    }

    return node;
}
