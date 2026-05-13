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
    pressBlend: any;
    slideImpulse: any;
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
