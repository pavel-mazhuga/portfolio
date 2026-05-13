import type { StorageBufferNode } from 'three/webgpu';

type HexGpuStorageForCpuMark =
    | StorageBufferNode<'float'>
    | StorageBufferNode<'vec2'>
    | StorageBufferNode<'vec3'>;

export function markStorageCpuWrite(storage: HexGpuStorageForCpuMark): void {
    const attr = storage.value as ({ needsUpdate?: boolean } & { pbo?: { needsUpdate?: boolean } }) | null | undefined;

    if (!attr) return;

    attr.needsUpdate = true;

    if (attr.pbo) {
        attr.pbo.needsUpdate = true;
    }
}
