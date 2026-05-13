import type {
    Color,
    StorageBufferNode,
    UniformNode,
    Vector3,
    VideoTexture,
} from 'three/webgpu';

export type GridLayout = {
    instCount: number;
    colorPhaseData: Float32Array;
    rotationPhaseData: Float32Array;
    uCentralWidth: UniformNode<'float', number>;
    uCentralHeight: UniformNode<'float', number>;
};

export type HexGridShaderUniforms = {
    projectTransition: UniformNode<'float', number>;
    videoTransition: UniformNode<'float', number>;
    bloomIntensity: UniformNode<'float', number>;
    cursorRadius: UniformNode<'float', number>;
    pointerRadiusMul: UniformNode<'float', number>;
    cursorStrength: UniformNode<'float', number>;
    damping: UniformNode<'float', number>;
    attractionStrength: UniformNode<'float', number>;
    trailColor: UniformNode<'color', Color>;
    flipSpeed: UniformNode<'float', number>;
    maxDist: UniformNode<'float', number>;
    minDist: UniformNode<'float', number>;
    pressBlend: UniformNode<'float', number>;
    slideImpulse: UniformNode<'float', number>;
    coarsePointerMix: UniformNode<'float', number>;
    introTransition: UniformNode<'float', number>;
    introStagger: UniformNode<'float', number>;
};

export type HexGridGpuDeps = {
    posStorage: StorageBufferNode<'vec3'>;
    velStorage: StorageBufferNode<'vec3'>;
    originStorage: StorageBufferNode<'vec3'>;
    targetAngleStorage: StorageBufferNode<'float'>;
    currentAngleStorage: StorageBufferNode<'float'>;
    frontVideoIndexStorage: StorageBufferNode<'float'>;
    backVideoIndexStorage: StorageBufferNode<'float'>;
    isCentralStorage: StorageBufferNode<'float'>;
    deltaUniform: UniformNode<'float', number>;
    pointerUniform: UniformNode<'vec3', Vector3>;
    uniforms: HexGridShaderUniforms;
    videoTextures: VideoTexture[];
};

export type HexGridMaterialDeps = HexGridGpuDeps & {
    colorPhaseStorage: StorageBufferNode<'vec2'>;
    rotPhaseStorage: StorageBufferNode<'vec3'>;
};
