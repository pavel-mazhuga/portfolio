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
import type { GridLayout, HexGridGpuDeps, HexGridMaterialDeps, HexGridVideoSlotTexture } from './types';
import { type GridVideoSetup, setupGridVideos } from './video/setup-grid-videos';
import { setupGridVideosForWorker } from './video/setup-grid-videos-worker';
import { hydrateGridVideosNeighborFirst, prefetchAdjacentGridVideos } from './video/adjacent-video-prefetch';
import { taskScheduler } from '@/shared/lib/scheduler';

type BuiltGridState = {
    mesh: InstancedMesh;
    computeUpdate: ComputeNode;
    posStorage: StorageBufferNode<'vec3'>;
    velStorage: StorageBufferNode<'vec3'>;
    originStorage: StorageBufferNode<'vec3'>;
    targetAngleStorage: StorageBufferNode<'float'>;
    currentAngleStorage: StorageBufferNode<'float'>;
    frontVideoIndexStorage: StorageBufferNode<'float'>;
    backVideoIndexStorage: StorageBufferNode<'float'>;
    isCentralStorage: StorageBufferNode<'float'>;
    isCentralData: Float32Array;
    initialPositionsData: Float32Array;
    centralRegionUniforms: Pick<GridLayout, 'uCentralWidth' | 'uCentralHeight'>;
    lastHexRadius: number;
    lastHexHeight: number;
    instCount: number;
    maxDist: number;
    minDist: number;
};

export type HexagonalGridVideoOptions = {
    useWorkerVideoPipeline: boolean;
    videoPlayback?: GridVideoPlayback;
    useCoarsePointer?: boolean;
    onMeshRebuilt?: (mesh: InstancedMesh) => void | Promise<void>;
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
    videoTextures: HexGridVideoSlotTexture[] = [];
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
    private readonly onMeshRebuilt?: (mesh: InstancedMesh) => void | Promise<void>;
    private readonly layoutCache = new Map<string, BuiltGridState>();
    private layoutCacheToken = 0;
    private rebuildGeneration = 0;
    private projectModeGeneration = 0;
    private lastViewportResizeKey?: string;

    constructor(
        private readonly renderer: WebGPURenderer,
        projectVideoUrls: string[],
        viewportSize: Vector2 = new Vector2(20, 11),
        videoOptions: HexagonalGridVideoOptions,
    ) {
        this.group = new Group();
        this.onMeshRebuilt = videoOptions.onMeshRebuilt;
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

    matchesRouteState(isProjectsPage: boolean): boolean {
        return this.projectModeActive === isProjectsPage;
    }

    ensureProjectVideosLoaded(urls: string[]): void {
        if (this.useWorkerVideoPipeline) return;

        if (urls.length === 0) return;

        hydrateGridVideosNeighborFirst(this.videos, urls, this.currentVideoIndex);
    }

    prefetchProjectVideosIdle(urls: readonly string[]): void {
        if (this.useWorkerVideoPipeline || urls.length === 0) {
            return;
        }

        hydrateGridVideosNeighborFirst(this.videos, urls, 0);
    }

    pauseVideos(): void {
        this.playback.pauseAll();
    }

    ensureLayoutCached(viewportSize: Vector2, forProjectMode: boolean): void {
        const cacheKey = this.#layoutCacheKey(viewportSize, forProjectMode);

        if (this.layoutCache.has(cacheKey)) {
            return;
        }

        if (forProjectMode === this.projectModeActive) {
            return;
        }

        const token = this.layoutCacheToken;

        void this.#buildAndCacheLayout(viewportSize, forProjectMode, token);
    }

    async prewarmAllRouteLayouts(viewportSize: Vector2): Promise<void> {
        const modes = [false, true] as const;

        for (const forProjectMode of modes) {
            if (forProjectMode === this.projectModeActive) {
                continue;
            }

            const cacheKey = this.#layoutCacheKey(viewportSize, forProjectMode);

            if (this.layoutCache.has(cacheKey)) {
                continue;
            }

            await this.#buildAndCacheLayout(viewportSize, forProjectMode, this.layoutCacheToken);
        }
    }

    async #buildAndCacheLayout(
        viewportSize: Vector2,
        forProjectMode: boolean,
        token: number,
    ): Promise<void> {
        if (token !== this.layoutCacheToken) {
            return;
        }

        const cacheKey = this.#layoutCacheKey(viewportSize, forProjectMode);

        if (this.layoutCache.has(cacheKey)) {
            return;
        }

        await taskScheduler.yieldFrame();

        if (token !== this.layoutCacheToken) {
            return;
        }

        const built = this.#buildDetachedGridState(viewportSize, forProjectMode, true);

        if (!built) {
            return;
        }

        this.#disposeCachedState(this.layoutCache.get(cacheKey));
        this.layoutCache.set(cacheKey, built);

        void this.onMeshRebuilt?.(built.mesh);
    }

    #layoutCacheKey(viewportSize: Vector2, forProjectMode: boolean): string {
        return `${this.#viewportKey(viewportSize)}:${forProjectMode ? 'projects' : 'home'}`;
    }

    #disposeCachedState(state?: BuiltGridState): void {
        if (!state) {
            return;
        }

        state.mesh.geometry.dispose();

        const material = state.mesh.material;

        if (material !== this.hexMaterial && !Array.isArray(material)) {
            material.dispose();
        }
    }

    private clearLayoutCache(): void {
        for (const state of this.layoutCache.values()) {
            this.#disposeCachedState(state);
        }

        this.layoutCache.clear();
        this.layoutCacheToken++;
    }

    #pruneStaleLayoutCache(viewportKey: string): void {
        for (const [key, state] of this.layoutCache) {
            if (!key.startsWith(`${viewportKey}:`)) {
                this.#disposeCachedState(state);
                this.layoutCache.delete(key);
            }
        }
    }

    resizeToViewport(viewportSize: Vector2): void {
        const viewportKey = this.#viewportKey(viewportSize);

        if (viewportKey === this.lastViewportResizeKey) {
            return;
        }

        this.lastViewportResizeKey = viewportKey;
        this.#pruneStaleLayoutCache(viewportKey);

        const generation = ++this.rebuildGeneration;

        void this.#rebuildGridAsync(viewportSize, generation).then(() => {
            if (generation !== this.rebuildGeneration) {
                return;
            }

            void this.prewarmAllRouteLayouts(viewportSize);
        });
    }

    private disposeCurrentGridMesh(): void {
        this.slideWave?.clearTimeouts();
        const mesh = this.mesh;

        if (!mesh) return;

        this.group.remove(mesh);
        mesh.geometry.dispose();

        this.mesh = undefined;
    }

    #layoutSizeForProjectMode(projectMode: boolean, viewportSize: Vector2): Vector2 {
        if (projectMode) {
            return new Vector2(viewportSize.x, viewportSize.y);
        }

        return new Vector2(viewportSize.x, this.layoutWorldExtentY ?? viewportSize.y);
    }

    #viewportKey(viewportSize: Vector2): string {
        return `${viewportSize.x.toFixed(4)}:${viewportSize.y.toFixed(4)}`;
    }

    #buildDetachedGridState(
        viewportSize: Vector2,
        layoutProjectMode: boolean,
        forPrefetch = false,
    ): BuiltGridState | null {
        const layoutSize = this.#layoutSizeForProjectMode(layoutProjectMode, viewportSize);
        const { radius: hexRadius, height: hexHeight } = effectiveHexDimensions(layoutSize.x, layoutSize.y);
        const hexLayout = buildHexLayout(layoutSize, hexRadius);

        if (this.mesh !== undefined && hexLayout.instCount === this.mesh.count) {
            return null;
        }

        const gridLayout = hexLayoutToGridLayout(hexLayout);
        const storages = createGridStorage(hexLayout);

        const gpuDeps: HexGridGpuDeps = {
            posStorage: storages.posStorage,
            velStorage: storages.velStorage,
            originStorage: storages.originStorage,
            targetAngleStorage: storages.targetAngleStorage,
            currentAngleStorage: storages.currentAngleStorage,
            frontVideoIndexStorage: storages.frontVideoIndexStorage,
            backVideoIndexStorage: storages.backVideoIndexStorage,
            isCentralStorage: storages.isCentralStorage,
            deltaUniform: this.deltaUniform,
            pointerUniform: this.pointerUniform,
            uniforms: this.uniforms,
            videoTextures: this.videoTextures,
        };

        const geometry = new CylinderGeometry(hexRadius, hexRadius, hexHeight, 6);

        let material: MeshPhysicalNodeMaterial;

        if (forPrefetch && this.hexMaterial) {
            material = new MeshPhysicalNodeMaterial({
                transmission: 1,
                thickness: 1,
                roughness: 1,
                ior: 1.5,
                metalness: 0.1,
                transparent: true,
            });
        } else {
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

            material = this.hexMaterial;
        }

        const materialDeps: HexGridMaterialDeps = {
            ...gpuDeps,
            colorPhaseStorage: storages.colorPhaseStorage,
            rotPhaseStorage: storages.rotPhaseStorage,
        };

        applyHexGridMaterial(
            material,
            materialDeps,
            gridLayout,
            this.videoWidthUniforms,
            this.videoHeightUniforms,
        );

        const mesh = new InstancedMesh(geometry, material, hexLayout.instCount);

        mesh.frustumCulled = false;
        mesh.visible = false;

        const computeUpdate = createUpdateCompute(hexLayout.instCount, gpuDeps);

        enqueueGridResetCompute(this.renderer, hexLayout.instCount, {
            posStorage: storages.posStorage,
            velStorage: storages.velStorage,
            originStorage: storages.originStorage,
            currentAngleStorage: storages.currentAngleStorage,
        });

        return {
            mesh,
            computeUpdate,
            posStorage: storages.posStorage,
            velStorage: storages.velStorage,
            originStorage: storages.originStorage,
            targetAngleStorage: storages.targetAngleStorage,
            currentAngleStorage: storages.currentAngleStorage,
            frontVideoIndexStorage: storages.frontVideoIndexStorage,
            backVideoIndexStorage: storages.backVideoIndexStorage,
            isCentralStorage: storages.isCentralStorage,
            isCentralData: hexLayout.isCentralData,
            initialPositionsData: hexLayout.initialPositionsData,
            centralRegionUniforms: {
                uCentralWidth: hexLayout.uCentralWidth,
                uCentralHeight: hexLayout.uCentralHeight,
            },
            lastHexRadius: hexRadius,
            lastHexHeight: hexHeight,
            instCount: hexLayout.instCount,
            maxDist: hexLayout.maxDist,
            minDist: hexLayout.minDistNonCentral,
        };
    }

    #applyBuiltGridState(state: BuiltGridState): void {
        this.disposeCurrentGridMesh();

        this.posStorage = state.posStorage;
        this.velStorage = state.velStorage;
        this.originStorage = state.originStorage;
        this.targetAngleStorage = state.targetAngleStorage;
        this.currentAngleStorage = state.currentAngleStorage;
        this.frontVideoIndexStorage = state.frontVideoIndexStorage;
        this.backVideoIndexStorage = state.backVideoIndexStorage;
        this.isCentralStorage = state.isCentralStorage;
        this.isCentralData = state.isCentralData;
        this.initialPositionsData = state.initialPositionsData;
        this.computeUpdate = state.computeUpdate;
        this.centralRegionUniforms = state.centralRegionUniforms;
        this.lastHexRadius = state.lastHexRadius;
        this.lastHexHeight = state.lastHexHeight;
        this.uniforms.maxDist.value = state.maxDist;
        this.uniforms.minDist.value = state.minDist;

        const meshMaterial = state.mesh.material;

        if (meshMaterial instanceof MeshPhysicalNodeMaterial && meshMaterial !== this.hexMaterial) {
            this.hexMaterial = meshMaterial;
        }

        state.mesh.visible = true;
        this.mesh = state.mesh;
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

        this.#syncVideoIndicesToCurrentSlide(state.instCount);
        this.uniforms.introTransition.value = 1;
        this.lastGridRebuildWasInPlace = false;
    }

    #tryCommitFromLayoutCache(active: boolean, viewportSize: Vector2): boolean {
        const cacheKey = this.#layoutCacheKey(viewportSize, active);
        const cached = this.layoutCache.get(cacheKey);

        if (!cached) {
            return false;
        }

        this.layoutCache.delete(cacheKey);
        this.#applyBuiltGridState(cached);

        return true;
    }

    async #rebuildGridAsync(viewportSize: Vector2, generation: number): Promise<void> {
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
            if (generation !== this.rebuildGeneration) {
                return;
            }

            this.applyResizeInPlace(hexLayout, layoutSize, hexRadius, hexHeight);
            this.lastGridRebuildWasInPlace = true;

            return;
        }

        await taskScheduler.yieldFrame();

        if (generation !== this.rebuildGeneration) {
            return;
        }

        const built = this.#buildDetachedGridState(viewportSize, this.projectModeActive);

        if (!built) {
            this.applyResizeInPlace(hexLayout, layoutSize, hexRadius, hexHeight);
            this.lastGridRebuildWasInPlace = true;

            return;
        }

        await taskScheduler.yieldFrame();

        if (generation !== this.rebuildGeneration) {
            built.mesh.geometry.dispose();

            return;
        }

        this.#applyBuiltGridState(built);
        void this.onMeshRebuilt?.(built.mesh);
    }

    private rebuildGrid(viewportSize: Vector2): void {
        this.rebuildGeneration++;
        this.clearLayoutCache();

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

        const built = this.#buildDetachedGridState(viewportSize, this.projectModeActive);

        if (!built) {
            this.applyResizeInPlace(hexLayout, layoutSize, hexRadius, hexHeight);
            this.lastGridRebuildWasInPlace = true;

            return;
        }

        this.uniforms.maxDist.value = hexLayout.maxDist;
        this.uniforms.minDist.value = hexLayout.minDistNonCentral;
        this.#applyBuiltGridState(built);
        void this.onMeshRebuilt?.(built.mesh);

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

        const posArr = this.posStorage.value?.array;
        const originArr = this.originStorage.value?.array;
        const velArr = this.velStorage.value?.array;
        const isCentralArr = this.isCentralStorage.value?.array;

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

        const frontArr = this.frontVideoIndexStorage.value?.array;
        const backArr = this.backVideoIndexStorage.value?.array;

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

    setupTweaks(folder: FolderApi): void {
        setupHexGridTweaks(folder, this.uniforms);
    }

    #applyProjectModeEnterStorageReset(): void {
        const instCount = this.mesh?.count ?? 0;
        const targetAngles = this.targetAngleStorage.value?.array;
        const frontIdx = this.frontVideoIndexStorage.value?.array;
        const backIdx = this.backVideoIndexStorage.value?.array;

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

        const skipLayoutRebuild =
            this.mesh !== undefined &&
            this.#layoutSizeForProjectMode(this.projectModeActive, viewportSize).equals(
                this.#layoutSizeForProjectMode(active, viewportSize),
            );

        this.projectModeActive = active;

        if (active) {
            this.currentVideoIndex = 0;
            this.uniforms.projectTransition.value = 0;
            this.uniforms.videoTransition.value = 0;
        }

        const generation = ++this.projectModeGeneration;

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

        void taskScheduler.schedule(() => {
            if (generation !== this.projectModeGeneration) {
                return;
            }

            this.#applyProjectModeGridWork(active, viewportSize, skipLayoutRebuild);
        }, { priority: active ? 'background' : 'user-visible' });

        this.ensureLayoutCached(viewportSize, !active);

        return true;
    }

    #applyProjectModeGridWork(active: boolean, viewportSize: Vector2, skipLayoutRebuild: boolean): void {
        if (!active) {
            const targetAngles = this.targetAngleStorage.value?.array;
            const currentFlipped = targetAngles !== undefined && Math.round(targetAngles[0] / Math.PI) % 2 !== 0;

            if (currentFlipped) {
                this.nextSlide();
            }
        }

        let committedPrefetch = false;

        if (skipLayoutRebuild) {
            if (active) {
                this.layoutWorldExtentY = viewportSize.y;
            }

            this.lastGridRebuildWasInPlace = true;
        } else if (active) {
            const cacheKey = this.#layoutCacheKey(viewportSize, true);
            const cached = this.layoutCache.get(cacheKey);

            if (cached) {
                const generation = this.projectModeGeneration;

                void taskScheduler.yieldFrame().then(() => {
                    if (generation !== this.projectModeGeneration) {
                        return;
                    }

                    const pending = this.layoutCache.get(cacheKey);

                    if (!pending) {
                        return;
                    }

                    this.layoutCache.delete(cacheKey);
                    this.#applyBuiltGridState(pending);

                    void taskScheduler.yieldFrame().then(() => {
                        if (generation !== this.projectModeGeneration) {
                            return;
                        }

                        this.#applyProjectModeEnterStorageReset();
                    });
                });

                this.lastGridRebuildWasInPlace = false;

                return;
            }

            const rebuildGeneration = ++this.rebuildGeneration;

            this.clearLayoutCache();
            void this.#rebuildGridAsync(viewportSize, rebuildGeneration).then(() => {
                if (!this.projectModeActive) {
                    return;
                }

                this.#applyProjectModeEnterStorageReset();
            });
            this.lastGridRebuildWasInPlace = false;
        } else {
            committedPrefetch = this.#tryCommitFromLayoutCache(active, viewportSize);

            if (!committedPrefetch) {
                const rebuildGeneration = ++this.rebuildGeneration;

                this.clearLayoutCache();
                void this.#rebuildGridAsync(viewportSize, rebuildGeneration);
            }

            this.lastGridRebuildWasInPlace = false;
        }

        if (active && (this.lastGridRebuildWasInPlace || committedPrefetch)) {
            void taskScheduler.yieldFrame().then(() => {
                if (!this.projectModeActive) {
                    return;
                }

                this.#applyProjectModeEnterStorageReset();
            });
        }
    }

    setSlide(index: number): void {
        if (this.currentVideoIndex === index) return;

        this.currentVideoIndex = index;

        if (!this.useWorkerVideoPipeline) {
            prefetchAdjacentGridVideos(this.videos, this.currentVideoIndex);
        }

        if (this.projectModeActive) {
            this.#clearSlidePlaybackSettleTimer();
            this.playback.ensurePlaying(this.currentVideoIndex);
            const settledForIndex = this.currentVideoIndex;
            const settleMs = slideWaveSettleDurationMs(this.uniforms.flipSpeed.value);

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
        this.clearLayoutCache();
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
