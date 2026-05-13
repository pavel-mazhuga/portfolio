import { Fn, instanceIndex, vec3 } from 'three/tsl';
import type { WebGPURenderer } from 'three/webgpu';
import type { AnyStorageBuffer } from '../types';

export function runResetCompute(
    renderer: WebGPURenderer,
    instCount: number,
    storages: {
        posStorage: AnyStorageBuffer;
        velStorage: AnyStorageBuffer;
        originStorage: AnyStorageBuffer;
        currentAngleStorage: AnyStorageBuffer;
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
