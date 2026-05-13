import type { AnyStorageBuffer } from '../types';

export function markStorageCpuWrite(storage: AnyStorageBuffer): void {
    const attr = storage.value as ({ needsUpdate?: boolean } & { pbo?: { needsUpdate?: boolean } }) | null | undefined;

    if (!attr) return;
    attr.needsUpdate = true;

    if (attr.pbo) {
        attr.pbo.needsUpdate = true;
    }
}
