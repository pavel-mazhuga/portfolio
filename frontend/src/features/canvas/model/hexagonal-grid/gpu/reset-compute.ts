import { Fn, instanceIndex, vec3 } from 'three/tsl';
import type { StorageBufferNode, WebGPURenderer } from 'three/webgpu';

export function runResetCompute(
    renderer: WebGPURenderer,
    instCount: number,
    storages: {
        posStorage: StorageBufferNode<'vec3'>;
        velStorage: StorageBufferNode<'vec3'>;
        originStorage: StorageBufferNode<'vec3'>;
        currentAngleStorage: StorageBufferNode<'float'>;
    },
): void {
    const { posStorage, velStorage, originStorage, currentAngleStorage } = storages;

    renderer.computeAsync(
        Fn(() => {
            const pos = posStorage.element(instanceIndex);
            const vel = velStorage.element(instanceIndex);
            const origin = originStorage.element(instanceIndex);
            const currentAngle = currentAngleStorage.element(instanceIndex);

            pos.assign(origin);
            vel.assign(vec3(0));
            currentAngle.assign(0);
        })().compute(instCount),
    );
}
