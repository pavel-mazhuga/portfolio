import { instancedArray } from 'three/tsl';
import type { HexLayoutResult } from '../layout/build-hex-layout';
import type { AnyStorageBuffer } from '../types';

export type GridStorages = {
    posStorage: AnyStorageBuffer;
    velStorage: AnyStorageBuffer;
    originStorage: AnyStorageBuffer;
    targetAngleStorage: AnyStorageBuffer;
    currentAngleStorage: AnyStorageBuffer;
    frontVideoIndexStorage: AnyStorageBuffer;
    backVideoIndexStorage: AnyStorageBuffer;
    isCentralStorage: AnyStorageBuffer;
    colorPhaseStorage: AnyStorageBuffer;
    rotPhaseStorage: AnyStorageBuffer;
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
