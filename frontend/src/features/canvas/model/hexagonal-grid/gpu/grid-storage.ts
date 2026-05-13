import { instancedArray } from 'three/tsl';
import type { HexLayoutResult } from '../layout/build-hex-layout';
import type { StorageBufferNode } from 'three/webgpu';

export type GridStorages = {
    posStorage: StorageBufferNode<'vec3'>;
    velStorage: StorageBufferNode<'vec3'>;
    originStorage: StorageBufferNode<'vec3'>;
    targetAngleStorage: StorageBufferNode<'float'>;
    currentAngleStorage: StorageBufferNode<'float'>;
    frontVideoIndexStorage: StorageBufferNode<'float'>;
    backVideoIndexStorage: StorageBufferNode<'float'>;
    isCentralStorage: StorageBufferNode<'float'>;
    colorPhaseStorage: StorageBufferNode<'vec2'>;
    rotPhaseStorage: StorageBufferNode<'vec3'>;
};

export function createGridStorage(layout: HexLayoutResult): GridStorages {
    const { instCount, colorPhaseData, rotationPhaseData, initialPositionsData } = layout;
    const { targetAngleData, frontVideoIndexData, backVideoIndexData, isCentralData } = layout;

    const posStorage = instancedArray(initialPositionsData, 'vec3').setPBO(true);
    const velStorage = instancedArray(instCount, 'vec3').setPBO(true);
    const originStorage = instancedArray(initialPositionsData, 'vec3').setPBO(true);

    const colorPhaseStorage = instancedArray(colorPhaseData, 'vec2').setPBO(true);
    const rotPhaseStorage = instancedArray(rotationPhaseData, 'vec3').setPBO(true);

    const targetAngleStorage = instancedArray(targetAngleData, 'float').setPBO(true);
    const currentAngleStorage = instancedArray(instCount, 'float').setPBO(true);
    const frontVideoIndexStorage = instancedArray(frontVideoIndexData, 'float').setPBO(true);
    const backVideoIndexStorage = instancedArray(backVideoIndexData, 'float').setPBO(true);
    const isCentralStorage = instancedArray(isCentralData, 'float').setPBO(true);

    return {
        posStorage,
        velStorage,
        originStorage,
        targetAngleStorage,
        currentAngleStorage,
        frontVideoIndexStorage,
        backVideoIndexStorage,
        isCentralStorage,
        colorPhaseStorage,
        rotPhaseStorage,
    };
}
