import gsap from 'gsap';
import { Fn, instanceIndex, uniform } from 'three/tsl';
import {
    Color,
    ComputeNode,
    CylinderGeometry,
    Group,
    InstancedMesh,
    MeshPhysicalNodeMaterial,
    type StorageBufferNode,
    Vector2,
    Vector3,
    type VideoTexture,
    WebGPURenderer,
} from 'three/webgpu';
import { type FolderApi } from 'tweakpane';
import {
    COARSE_POINTER_CURSOR_RADIUS_DIVISOR,
    COARSE_POINTER_CURSOR_STRENGTH_DIVISOR,
    COARSE_POINTER_PRESS_DECAY_TAU_SEC,
    GRID_INTRO_SCALE_DURATION,
    GRID_INTRO_STAGGER,
    SLIDE_SYNTH_IMPULSE,
    centralRegionDimensions,
    effectiveHexDimensions,
} from './constants';
import { createGridStorage } from './gpu/grid-storage';
import { markStorageCpuWrite } from './gpu/mark-storage-cpu-write';
import { runResetCompute as enqueueGridResetCompute } from './gpu/reset-compute';
import { createUpdateCompute } from './gpu/update-compute';
import { type GridVideoPlayback, buildProjectModeTimeline } from './interaction/project-mode';
import { SlideWaveController } from './interaction/slide-wave';
import { type HexLayoutResult, buildHexLayout, hexLayoutToGridLayout } from './layout/build-hex-layout';
import { slideWaveSettleDurationMs } from './lib/flip-timing';
import { applyHexGridMaterial } from './tsl/hex-grid-material';
import { setupHexGridTweaks } from './tweaks/hex-grid-tweaks';
import type { GridLayout, HexGridGpuDeps, HexGridMaterialDeps } from './types';
import { type GridVideoSetup, setupGridVideos } from './video/setup-grid-videos';
import { setupGridVideosForWorker } from './video/setup-grid-videos-worker';

export type HexagonalGridVideoOptions = {
    useWorkerVideoPipeline: boolean;
    videoPlayback?: GridVideoPlayback;
    useCoarsePointer?: boolean;
};

export class HexagonalGrid {
    group: Group;
    mesh?: InstancedMesh;
    private videos: HTMLVideoElement[] = [];
    private readonly useWorkerVideoPipeline: boolean;
    private pushVideoFrameInternal?: (index: number, frame: VideoFrame) => void;
    private setVideoDimensionsInternal?: (index: number, width: number, height: number) => void;
    private disposeWorkerVideoSetup?: () => void;
    private playback: GridVideoPlayback;
    videoTextures: VideoTexture[] = [];
    private timeline?: gsap.core.Timeline;

    private readonly videoMetadataHandlers: { video: HTMLVideoElement; listener: () => void }[] = [];
    private releaseVideoFramePush?: () => void;
    private slideWave!: SlideWaveController;
    private videoWidthUniforms!: GridVideoSetup['videoWidths'];
    private videoHeightUniforms!: GridVideoSetup['videoHeights'];
    private userPressed = false;
    private readonly useCoarsePointer: boolean;
    private pressBlendCpu = 0;

    computeUpdate!: ComputeNode;

    deltaUniform = uniform(0);
    pointerUniform = uniform(new Vector3(0, 0, 0));

    params = {
        bloomIntensity: 1.5,
        cursorRadius: 6,
        cursorStrength: 50,
        damping: 7,
        attractionStrength: 1,
        trailColor: new Color('hsl(255, 100%, 35%)').convertLinearToSRGB(),
        flipSpeed: 2.5,
    };

    uniforms = {
        projectTransition: uniform(0),
        videoTransition: uniform(0),
        bloomIntensity: uniform(this.params.bloomIntensity),
        cursorRadius: uniform(this.params.cursorRadius),
        pointerRadiusMul: uniform(1),
        cursorStrength: uniform(this.params.cursorStrength),
        damping: uniform(this.params.damping),
        attractionStrength: uniform(this.params.attractionStrength),
        trailColor: uniform(this.params.trailColor),
        flipSpeed: uniform(this.params.flipSpeed),
        maxDist: uniform(1),
        minDist: uniform(0),
        pressBlend: uniform(0),
        slideImpulse: uniform(0),
        coarsePointerMix: uniform(0),
        introTransition: uniform(0),
        introStagger: uniform(GRID_INTRO_STAGGER),
    };

    public currentVideoIndex = 0;
    private targetAngleStorage!: StorageBufferNode<'float'>;
    private currentAngleStorage!: StorageBufferNode<'float'>;
    private posStorage!: StorageBufferNode<'vec3'>;
    private velStorage!: StorageBufferNode<'vec3'>;
    private originStorage!: StorageBufferNode<'vec3'>;
    private frontVideoIndexStorage!: StorageBufferNode<'float'>;
    private backVideoIndexStorage!: StorageBufferNode<'float'>;
    private isCentralData!: Float32Array;
    private isCentralStorage!: StorageBufferNode<'float'>;
    private initialPositionsData!: Float32Array;
    private layoutWorldExtentY?: number;
    private centralRegionUniforms?: Pick<GridLayout, 'uCentralWidth' | 'uCentralHeight'>;
    private lastHexRadius = 0;
    private lastHexHeight = 0;
    private lastGridRebuildWasInPlace = false;
    private projectModeActive = false;
    private isFirstGridBuild = true;
    private introScaleTween?: gsap.core.Tween;
    private slidePlaybackSettleTimer: ReturnType<typeof setTimeout> | undefined;

    private hexMaterial?: MeshPhysicalNodeMaterial;

    constructor(
        private readonly renderer: WebGPURenderer,
        projectVideoUrls: string[],
        viewportSize: Vector2 = new Vector2(20, 11),
        videoOptions: HexagonalGridVideoOptions,
    ) {
        this.group = new Group();
        this.useCoarsePointer = videoOptions.useCoarsePointer ?? false;
        this.uniforms.coarsePointerMix.value = this.useCoarsePointer ? 1 : 0;

        if (this.useCoarsePointer) {
            this.uniforms.cursorRadius.value = this.params.cursorRadius / COARSE_POINTER_CURSOR_RADIUS_DIVISOR;
            this.uniforms.cursorStrength.value = this.params.cursorStrength / COARSE_POINTER_CURSOR_STRENGTH_DIVISOR;
        }

        this.useWorkerVideoPipeline = videoOptions.useWorkerVideoPipeline;

        if (videoOptions.useWorkerVideoPipeline) {
            if (!videoOptions.videoPlayback) {
                throw new Error('HexagonalGrid: videoPlayback is required when useWorkerVideoPipeline is true');
            }
            this.playback = videoOptions.videoPlayback;
            const workerSetup = setupGridVideosForWorker(projectVideoUrls.length);

            this.videoTextures = workerSetup.videoTextures;
            this.videoWidthUniforms = workerSetup.videoWidths;
            this.videoHeightUniforms = workerSetup.videoHeights;
            this.pushVideoFrameInternal = workerSetup.pushFrame;
            this.setVideoDimensionsInternal = workerSetup.setVideoDimensions;
            this.disposeWorkerVideoSetup = workerSetup.dispose;
        } else {
            const videoSetup = setupGridVideos(projectVideoUrls, { deferSrc: true });

            this.videos = videoSetup.videos;
            this.videoTextures = videoSetup.videoTextures;
            this.videoMetadataHandlers.push(...videoSetup.metadataHandlers);
            this.releaseVideoFramePush = videoSetup.releaseVideoFramePush;
            this.videoWidthUniforms = videoSetup.videoWidths;
            this.videoHeightUniforms = videoSetup.videoHeights;
            this.playback = {
                playOnly: (index: number) => {
                    for (let i = 0; i < this.videos.length; i++) {
                        const video = this.videos[i];

                        if (i === index) {
                            void video.play().catch(() => {});
                        } else {
                            video.pause();
                        }
                    }
                },
                ensurePlaying: (index: number) => {
                    const video = this.videos[index];

                    if (video) {
                        void video.play().catch(() => {});
                    }
                },
                pauseAll: () => {
                    for (const video of this.videos) {
                        video.pause();
                    }
                },
            };
        }

        this.rebuildGrid(viewportSize);
    }

    pushVideoFrame(index: number, frame: VideoFrame): void {
        this.pushVideoFrameInternal?.(index, frame);
    }

    setVideoSlotDimensions(index: number, width: number, height: number): void {
        this.setVideoDimensionsInternal?.(index, width, height);
    }

    ensureProjectVideosLoaded(urls: string[]): void {
        if (this.useWorkerVideoPipeline) return;

        if (urls.length === 0) return;

        for (let i = 0; i < this.videos.length; i++) {
            const url = urls[i];
            const video = this.videos[i];

            if (!url || !video || video.src) {
                continue;
            }

            video.src = url;
        }
    }

    resizeToViewport(viewportSize: Vector2): void {
        this.rebuildGrid(viewportSize);
    }

    private disposeCurrentGridMesh(): void {
        this.slideWave?.clearTimeouts();
        const mesh = this.mesh;

        if (!mesh) return;
        this.group.remove(mesh);
        mesh.geometry.dispose();

        this.mesh = undefined;
    }

    #layoutSizeForMode(projectMode: boolean, viewportSize: Vector2): Vector2 {
        if (projectMode) {
            return new Vector2(viewportSize.x, viewportSize.y);
        }

        return new Vector2(viewportSize.x, this.layoutWorldExtentY ?? viewportSize.y);
    }

    private rebuildGrid(viewportSize: Vector2): void {
        if (this.projectModeActive) {
            this.layoutWorldExtentY = viewportSize.y;
        } else if (this.layoutWorldExtentY === undefined) {
            this.layoutWorldExtentY = viewportSize.y;
        }

        const layoutSize = this.projectModeActive
            ? new Vector2(viewportSize.x, viewportSize.y)
            : new Vector2(viewportSize.x, this.layoutWorldExtentY);

        const { radius: hexRadius, height: hexHeight } = effectiveHexDimensions(layoutSize.x, layoutSize.y);
        const hexLayout = buildHexLayout(layoutSize, hexRadius);

        const canResizeInPlace =
            this.mesh !== undefined &&
            this.centralRegionUniforms !== undefined &&
            hexLayout.instCount === this.mesh.count;

        if (canResizeInPlace) {
            this.applyResizeInPlace(hexLayout, layoutSize, hexRadius, hexHeight);
            this.lastGridRebuildWasInPlace = true;

            return;
        }

        this.lastGridRebuildWasInPlace = false;
        this.disposeCurrentGridMesh();

        this.isCentralData = hexLayout.isCentralData;
        this.initialPositionsData = hexLayout.initialPositionsData;
        this.uniforms.maxDist.value = hexLayout.maxDist;
        this.uniforms.minDist.value = hexLayout.minDistNonCentral;

        const gridLayout = hexLayoutToGridLayout(hexLayout);
        const storages = createGridStorage(hexLayout);

        this.posStorage = storages.posStorage;
        this.velStorage = storages.velStorage;
        this.originStorage = storages.originStorage;
        this.targetAngleStorage = storages.targetAngleStorage;
        this.currentAngleStorage = storages.currentAngleStorage;
        this.frontVideoIndexStorage = storages.frontVideoIndexStorage;
        this.backVideoIndexStorage = storages.backVideoIndexStorage;
        this.isCentralStorage = storages.isCentralStorage;

        this.runResetCompute(hexLayout.instCount);

        const gpuDeps: HexGridGpuDeps = {
            posStorage: this.posStorage,
            velStorage: this.velStorage,
            originStorage: this.originStorage,
            targetAngleStorage: this.targetAngleStorage,
            currentAngleStorage: this.currentAngleStorage,
            frontVideoIndexStorage: this.frontVideoIndexStorage,
            backVideoIndexStorage: this.backVideoIndexStorage,
            isCentralStorage: this.isCentralStorage,
            deltaUniform: this.deltaUniform,
            pointerUniform: this.pointerUniform,
            uniforms: this.uniforms,
            videoTextures: this.videoTextures,
        };

        this.computeUpdate = createUpdateCompute(hexLayout.instCount, gpuDeps);

        const geometry = new CylinderGeometry(hexRadius, hexRadius, hexHeight, 6);

        if (!this.hexMaterial) {
            this.hexMaterial = new MeshPhysicalNodeMaterial({
                transmission: 1,
                thickness: 1,
                roughness: 1,
                ior: 1.5,
                metalness: 0.1,
                transparent: true,
            });
        }

        const materialDeps: HexGridMaterialDeps = {
            ...gpuDeps,
            colorPhaseStorage: storages.colorPhaseStorage,
            rotPhaseStorage: storages.rotPhaseStorage,
        };

        applyHexGridMaterial(
            this.hexMaterial,
            materialDeps,
            gridLayout,
            this.videoWidthUniforms,
            this.videoHeightUniforms,
        );

        this.centralRegionUniforms = {
            uCentralWidth: hexLayout.uCentralWidth,
            uCentralHeight: hexLayout.uCentralHeight,
        };
        this.lastHexRadius = hexRadius;
        this.lastHexHeight = hexHeight;

        this.mesh = new InstancedMesh(geometry, this.hexMaterial, hexLayout.instCount);
        this.mesh.frustumCulled = false;

        this.group.add(this.mesh);

        this.slideWave = new SlideWaveController({
            mesh: this.mesh,
            isCentralData: this.isCentralData,
            initialPositionsData: this.initialPositionsData,
            targetAngleStorage: this.targetAngleStorage,
            frontVideoIndexStorage: this.frontVideoIndexStorage,
            backVideoIndexStorage: this.backVideoIndexStorage,
            getFlipSpeed: () => this.uniforms.flipSpeed.value,
        });

        this.#syncVideoIndicesToCurrentSlide(hexLayout.instCount);

        this.introScaleTween?.kill();

        if (this.isFirstGridBuild) {
            this.isFirstGridBuild = false;
            this.uniforms.introTransition.value = 0;
            this.introScaleTween = gsap.to(this.uniforms.introTransition, {
                value: 1,
                duration: GRID_INTRO_SCALE_DURATION,
                ease: 'power2.out',
                onComplete: () => {
                    this.introScaleTween = undefined;
                },
            });
        } else {
            this.uniforms.introTransition.value = 1;
        }
    }

    private applyResizeInPlace(
        hexLayout: HexLayoutResult,
        layoutSize: Vector2,
        hexRadius: number,
        hexHeight: number,
    ): void {
        this.isCentralData.set(hexLayout.isCentralData);
        this.initialPositionsData.set(hexLayout.initialPositionsData);

        this.uniforms.maxDist.value = hexLayout.maxDist;
        this.uniforms.minDist.value = hexLayout.minDistNonCentral;

        const { width: cw, height: ch } = centralRegionDimensions(layoutSize.x, layoutSize.y);
        const cu = this.centralRegionUniforms!;

        cu.uCentralWidth.value = cw;
        cu.uCentralHeight.value = ch;

        const posArr = this.posStorage.value?.array as Float32Array | undefined;
        const originArr = this.originStorage.value?.array as Float32Array | undefined;
        const velArr = this.velStorage.value?.array as Float32Array | undefined;
        const isCentralArr = this.isCentralStorage.value?.array as Float32Array | undefined;

        if (posArr) {
            posArr.set(hexLayout.initialPositionsData);
        }

        if (originArr) {
            originArr.set(hexLayout.initialPositionsData);
        }

        if (velArr) {
            velArr.fill(0);
        }

        if (isCentralArr) {
            isCentralArr.set(hexLayout.isCentralData);
        }

        markStorageCpuWrite(this.posStorage);
        markStorageCpuWrite(this.originStorage);
        markStorageCpuWrite(this.velStorage);
        markStorageCpuWrite(this.isCentralStorage);

        if (this.lastHexRadius !== hexRadius || this.lastHexHeight !== hexHeight) {
            this.mesh!.geometry.dispose();
            this.mesh!.geometry = new CylinderGeometry(hexRadius, hexRadius, hexHeight, 6);
            this.lastHexRadius = hexRadius;
            this.lastHexHeight = hexHeight;
        }
    }

    #syncVideoIndicesToCurrentSlide(instCount: number): void {
        const slotCount = this.videoTextures.length;

        if (slotCount === 0) {
            return;
        }

        const cur = Math.min(this.currentVideoIndex, slotCount - 1);
        const back = slotCount <= 1 ? cur : (cur + 1) % slotCount;

        const frontArr = this.frontVideoIndexStorage.value?.array as Float32Array | undefined;
        const backArr = this.backVideoIndexStorage.value?.array as Float32Array | undefined;

        if (!frontArr || !backArr) {
            return;
        }

        for (let i = 0; i < instCount; i++) {
            frontArr[i] = cur;
            backArr[i] = back;
        }

        markStorageCpuWrite(this.frontVideoIndexStorage);
        markStorageCpuWrite(this.backVideoIndexStorage);

        this.playback.ensurePlaying(cur);
    }

    private runResetCompute(instCount: number): void {
        enqueueGridResetCompute(this.renderer, instCount, {
            posStorage: this.posStorage,
            velStorage: this.velStorage,
            originStorage: this.originStorage,
            currentAngleStorage: this.currentAngleStorage,
        });
    }

    setupTweaks(folder: FolderApi): void {
        setupHexGridTweaks(folder, this.uniforms);
    }

    #applyProjectModeEnterStorageReset(): void {
        const instCount = this.mesh?.count ?? 0;
        const targetAngles = this.targetAngleStorage.value?.array as Float32Array | undefined;
        const frontIdx = this.frontVideoIndexStorage.value?.array as Float32Array | undefined;
        const backIdx = this.backVideoIndexStorage.value?.array as Float32Array | undefined;

        if (targetAngles && frontIdx && backIdx) {
            for (let i = 0; i < instCount; i++) {
                targetAngles[i] = 0;
                frontIdx[i] = 0;
                backIdx[i] = 1;
            }
        }

        markStorageCpuWrite(this.targetAngleStorage);
        markStorageCpuWrite(this.frontVideoIndexStorage);
        markStorageCpuWrite(this.backVideoIndexStorage);

        this.renderer.computeAsync(
            Fn(() => {
                const currentAngle = this.currentAngleStorage.element(instanceIndex);

                currentAngle.assign(0);
            })().compute(instCount),
        );
    }

    #syncPressBlend(delta: number): void {
        if (this.useCoarsePointer) {
            if (this.userPressed) {
                this.pressBlendCpu = 1;
            } else {
                this.pressBlendCpu *= Math.exp(-delta / COARSE_POINTER_PRESS_DECAY_TAU_SEC);

                if (this.pressBlendCpu < 0.001) {
                    this.pressBlendCpu = 0;
                }
            }
        } else {
            this.pressBlendCpu = this.userPressed ? 1 : 0;
        }
        this.uniforms.pressBlend.value = this.pressBlendCpu;
    }

    updatePointer(pointer: Vector3, delta: number): void {
        this.deltaUniform.value = delta;
        this.#syncPressBlend(delta);

        if (performance.now() < this.slideWave.slideCenterBoostUntil) {
            this.pointerUniform.value.set(0, 0, 0);
            this.uniforms.slideImpulse.value = SLIDE_SYNTH_IMPULSE;
        } else {
            this.pointerUniform.value.copy(pointer);
            this.uniforms.slideImpulse.value = 0;
        }
    }

    setPressed(isPressed: boolean): void {
        this.userPressed = isPressed;
    }

    setPointerRadiusMul(value: number): void {
        this.uniforms.pointerRadiusMul.value = value;
    }

    #clearSlidePlaybackSettleTimer(): void {
        if (this.slidePlaybackSettleTimer !== undefined) {
            clearTimeout(this.slidePlaybackSettleTimer);
            this.slidePlaybackSettleTimer = undefined;
        }
    }

    setProjectMode(active: boolean, viewportSize: Vector2): boolean {
        if (this.projectModeActive === active) {
            return false;
        }

        this.#clearSlidePlaybackSettleTimer();
        this.slideWave?.clearTimeouts();

        if (this.slideWave) {
            this.slideWave.slideCenterBoostUntil = 0;
        }

        this.uniforms.slideImpulse.value = 0;
        this.pressBlendCpu = this.userPressed ? 1 : 0;
        this.uniforms.pressBlend.value = this.pressBlendCpu;

        this.timeline?.kill();

        const fromLayout = this.#layoutSizeForMode(this.projectModeActive, viewportSize);
        const toLayout = this.#layoutSizeForMode(active, viewportSize);
        const skipLayoutRebuild = this.mesh !== undefined && fromLayout.equals(toLayout);

        if (!active) {
            const targetAngles = this.targetAngleStorage.value?.array as Float32Array | undefined;
            const currentFlipped = targetAngles !== undefined && Math.round(targetAngles[0] / Math.PI) % 2 !== 0;

            if (currentFlipped) {
                this.nextSlide();
            }
        }

        this.projectModeActive = active;

        if (active) {
            this.currentVideoIndex = 0;
        }

        if (skipLayoutRebuild) {
            if (active) {
                this.layoutWorldExtentY = viewportSize.y;
            }

            this.lastGridRebuildWasInPlace = true;
        } else {
            this.rebuildGrid(viewportSize);
        }

        if (active) {
            this.uniforms.projectTransition.value = 0;
            this.uniforms.videoTransition.value = 0;

            if (this.lastGridRebuildWasInPlace) {
                this.#applyProjectModeEnterStorageReset();
            }
        }

        this.timeline = buildProjectModeTimeline(active, {
            uniforms: this.uniforms,
            resumeProjectPlayback: () => {
                this.playback.playOnly(this.currentVideoIndex);
            },
        });

        if (!active) {
            this.timeline.eventCallback('onComplete', () => {
                this.playback.pauseAll();
                this.timeline?.eventCallback('onComplete', null);
            });
        }

        return true;
    }

    setSlide(index: number): void {
        if (this.currentVideoIndex === index) return;

        this.currentVideoIndex = index;

        if (this.projectModeActive) {
            this.#clearSlidePlaybackSettleTimer();
            this.playback.ensurePlaying(this.currentVideoIndex);
            const settledForIndex = this.currentVideoIndex;
            const settleMs = slideWaveSettleDurationMs(this.uniforms.flipSpeed.value as number);

            this.slidePlaybackSettleTimer = setTimeout(() => {
                this.slidePlaybackSettleTimer = undefined;

                if (this.projectModeActive && this.currentVideoIndex === settledForIndex) {
                    this.playback.playOnly(this.currentVideoIndex);
                }
            }, settleMs);
        }
        this.slideWave.startWave(this.currentVideoIndex);
    }

    prevSlide(): void {
        if (this.videoTextures.length === 0) return;
        const prevIndex = (this.currentVideoIndex - 1 + this.videoTextures.length) % this.videoTextures.length;

        this.setSlide(prevIndex);
    }

    nextSlide(): void {
        if (this.videoTextures.length === 0) return;
        const nextIndex = (this.currentVideoIndex + 1) % this.videoTextures.length;

        this.setSlide(nextIndex);
    }

    dispose(): void {
        this.introScaleTween?.kill();
        this.introScaleTween = undefined;
        this.#clearSlidePlaybackSettleTimer();
        this.slideWave?.clearTimeouts();

        if (this.slideWave) {
            this.slideWave.slideCenterBoostUntil = 0;
        }

        this.uniforms.slideImpulse.value = 0;
        this.timeline?.kill();
        this.timeline = undefined;

        for (const { video, listener } of this.videoMetadataHandlers) {
            video.removeEventListener('loadedmetadata', listener);
        }
        this.videoMetadataHandlers.length = 0;

        this.releaseVideoFramePush?.();
        this.releaseVideoFramePush = undefined;

        this.disposeCurrentGridMesh();
        this.hexMaterial?.dispose();
        this.hexMaterial = undefined;
        this.centralRegionUniforms = undefined;

        if (this.useWorkerVideoPipeline) {
            this.disposeWorkerVideoSetup?.();
            this.disposeWorkerVideoSetup = undefined;
        } else {
            this.videos.forEach((video) => {
                video.pause();
                video.src = '';
                video.load();
            });
            this.videoTextures.forEach((tex) => tex.dispose());
        }
    }
}
