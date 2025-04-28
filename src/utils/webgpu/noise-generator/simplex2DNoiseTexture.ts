import { OrthographicCamera } from 'three';
import { Fn, instanceIndex, texture, textureStore, uvec2, vec2, vec3, vec4 } from 'three/tsl';
import { MeshBasicNodeMaterial, StorageTexture, WebGPURenderer } from 'three/webgpu';
import { snoise } from '@/utils/webgpu/nodes/noise/simplexNoise2d';

export function computeSimplex2DNoiseTexture(
    renderer: WebGPURenderer,
    params = {
        width: 512,
        height: 512,
    },
) {
    const aspect = renderer.domElement.width / renderer.domElement.height;
    const camera = new OrthographicCamera(-aspect, aspect, 1, -1, 0, 2);
    camera.position.z = 1;

    const storageTexture = new StorageTexture(params.width, params.height);
    // storageTexture.minFilter = LinearMipMapLinearFilter;

    // @ts-ignore
    const computeTexture = Fn(({ storageTexture }) => {
        const posX = instanceIndex.mod(params.width);
        const posY = instanceIndex.div(params.width);
        const indexUV = uvec2(posX, posY);
        const r = snoise(vec2(posX, posY));
        textureStore(storageTexture, indexUV, vec4(vec3(r), 1)).toWriteOnly();
    });

    // @ts-ignore
    const computeNode = computeTexture({ storageTexture }).compute(params.width * params.height);

    const material = new MeshBasicNodeMaterial({ color: 0x00ff00 });
    material.colorNode = texture(storageTexture);

    renderer.computeAsync(computeNode);

    return storageTexture;
}
