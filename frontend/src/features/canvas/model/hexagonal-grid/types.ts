import type { VideoTexture } from 'three/webgpu';

export type AnyStorageBuffer = {
    value?: { needsUpdate?: boolean; array?: ArrayBufferView } | null;
    element(index: unknown): any;
    setPBO?(enabled: boolean): AnyStorageBuffer;
};

export type GridLayout = {
    instCount: number;
    colorPhaseData: Float32Array;
    rotationPhaseData: Float32Array;
    uCentralWidth: any;
    uCentralHeight: any;
};

/** TSL uniform nodes (`.value` on CPU, nodes in shader) */
export type HexGridShaderUniforms = {
    projectTransition: any;
    videoTransition: any;
    bloomIntensity: any;
    cursorRadius: any;
    pointerRadiusMul: any;
    cursorStrength: any;
    damping: any;
    attractionStrength: any;
    trailColor: any;
    flipSpeed: any;
    maxDist: any;
    minDist: any;
    // 0–1 press distortion strength (decays on coarse pointer after release).
    pressBlend: any;
    slideImpulse: any;
    // 0 = fine pointer (hover distortion OK); 1 = coarse — cursor repel only if press or slide impulse.
    coarsePointerMix: any;
    introTransition: any;
    introStagger: any;
};

export type HexGridGpuDeps = {
    posStorage: AnyStorageBuffer;
    velStorage: AnyStorageBuffer;
    originStorage: AnyStorageBuffer;
    targetAngleStorage: AnyStorageBuffer;
    currentAngleStorage: AnyStorageBuffer;
    frontVideoIndexStorage: AnyStorageBuffer;
    backVideoIndexStorage: AnyStorageBuffer;
    isCentralStorage: AnyStorageBuffer;
    deltaUniform: any;
    pointerUniform: any;
    uniforms: HexGridShaderUniforms;
    videoTextures: VideoTexture[];
};

export type HexGridMaterialDeps = HexGridGpuDeps & {
    colorPhaseStorage: AnyStorageBuffer;
    rotPhaseStorage: AnyStorageBuffer;
};
