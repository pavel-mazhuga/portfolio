import Stats, { StatsProfiler } from 'stats-gl';
import { fxaa } from 'three/addons/tsl/display/FXAANode.js';
import GaussianBlurNode, { gaussianBlur } from 'three/addons/tsl/display/GaussianBlurNode.js';
import { Fn, add, float, max, mrt, mx_fractal_noise_vec3, output, pass, screenUV, time, vec3, vec4 } from 'three/tsl';
import {
    ACESFilmicToneMapping,
    type Node,
    PerspectiveCamera,
    Plane,
    RenderPipeline,
    Scene,
    Timer,
    TimestampQuery,
    Vector2,
    Vector3,
    WebGPURenderer,
} from 'three/webgpu';
import { Pane } from 'tweakpane';
// eslint-disable-next-line fsd/layer-import-restrictions
import { projects } from '@/app/data/projects';
import { Pointer } from '../utils/Pointer';
import { Noises } from '../utils/tsl/Noises';
import { HexagonalGrid } from './hexagonal-grid';
import type { CanvasData, GridRouteState, IWorld } from './types';

const CAMERA_Z_BASE = 40;
const CAMERA_Z_REF_MIN_SIDE_PX = 880;
const CAMERA_Z_MIN = 16;
const CAMERA_Z_MAX = 96;

export class World implements IWorld {
    canvas: HTMLCanvasElement | OffscreenCanvas;
    renderer: WebGPURenderer;
    camera: PerspectiveCamera;
    scene: Scene;
    stats?: Stats;
    private statsProfiler?: StatsProfiler;
    clock = new Timer();
    prevTime = 0;
    pointerHandler: Pointer;
    noises?: Noises;
    hexGrid?: HexagonalGrid;
    tweakPane?: Pane;
    postProcessing?: RenderPipeline;
    glowBlurPass?: GaussianBlurNode;
    private disposed = false;

    constructor(readonly options: CanvasData) {
        this.render = this.render.bind(this);

        this.canvas = options.canvas;

        if (!('style' in this.canvas)) {
            (this.canvas as OffscreenCanvas & { style: { width: number; height: number } }).style = {
                width: options.width,
                height: options.height,
            };
        }

        this.canvas.width = options.width * options.dpr;
        this.canvas.height = options.height * options.dpr;

        this.renderer = new WebGPURenderer({
            canvas: this.canvas,
            antialias: false,
            powerPreference: 'high-performance',
        });
        this.renderer.toneMapping = ACESFilmicToneMapping;
        this.renderer.setPixelRatio(this.options.dpr);
        this.renderer.setSize(options.width, options.height);

        this.scene = new Scene();
        this.scene.backgroundNode = Fn(() => {
            const color = vec3(mx_fractal_noise_vec3(vec3(screenUV, time.mul(0.3)))).toVar();

            color.mulAssign(0.02);

            return vec4(color, 1);
        })();
        this.scene.environmentNode = vec3(0x77 / 255);

        this.camera = new PerspectiveCamera(30, options.width / options.height, 0.1, 500);
        this.camera.position.set(0, 0, computeCameraZForMinSide(options.width, options.height));

        this.pointerHandler = new Pointer(
            options.width,
            options.height,
            this.camera,
            new Plane(new Vector3(0, 0, 1), 0),
        );

        this.renderer.init().then(async () => {
            if (this.disposed) {
                return;
            }

            this.noises = new Noises(this.renderer);

            const visibleHeight = 2 * Math.tan((this.camera.fov * Math.PI) / 360) * this.camera.position.z;
            const visibleWidth = visibleHeight * this.camera.aspect;

            const deferredVideoSlots = Array.from({ length: projects.length }, () => '');

            this.hexGrid = new HexagonalGrid(
                this.renderer,
                deferredVideoSlots,
                new Vector2(visibleWidth, visibleHeight),
                {
                    useWorkerVideoPipeline: options.isWorker,
                    videoPlayback: options.videoPlayback,
                    useCoarsePointer: options.useCoarsePointer,
                },
            );
            this.scene.add(this.hexGrid.group);

            /**
             * Post processing
             */

            this.postProcessing = new RenderPipeline(this.renderer);

            // Color
            const scenePass = pass(this.scene, this.camera);

            scenePass.setMRT(
                mrt({
                    output,
                    bloomIntensity: float(0),
                }),
            );

            const outputPass = scenePass;
            const fxaaPass = fxaa(outputPass);
            const bloomIntensityPass = scenePass.getTextureNode('bloomIntensity');

            // Blur is faster than bloom with the same visual effect
            this.glowBlurPass = gaussianBlur(outputPass.mul(max(bloomIntensityPass.r, float(0))), null, 8, {
                resolutionScale: 0.5,
            });

            this.postProcessing.outputNode = add(fxaaPass as unknown as Node<'vec4'>, this.glowBlurPass);

            if (process.env.NODE_ENV === 'development' && options.isWorker && options.onStatsData) {
                this.statsProfiler = new StatsProfiler({
                    trackGPU: true,
                    trackCPT: true,
                });
                await this.statsProfiler.init(this.renderer);

                if (this.disposed) {
                    return;
                }
            }

            this.renderer.setAnimationLoop(this.render);

            if (process.env.NODE_ENV === 'development' && !options.isWorker) {
                this.initTweakpane();
            }

            options.onInitialized?.();
        });

        if (process.env.NODE_ENV === 'development' && !options.isWorker) {
            this.stats = new Stats({
                trackGPU: true,
                trackCPT: true,
            });
            this.stats.domElement.classList.add('stats-gl');
            this.stats.init(this.renderer);
            document.body.appendChild(this.stats.dom);
        }
    }

    applyRouteState(state: GridRouteState) {
        if (!this.options.isWorker) {
            this.hexGrid?.ensureProjectVideosLoaded(state.videoUrls);
        }

        this.hexGrid?.setProjectMode(state.isProjectsPage, this.getVisibleWorldSize());
    }

    prevSlide() {
        this.hexGrid?.prevSlide();
    }

    nextSlide() {
        this.hexGrid?.nextSlide();
    }

    pushVideoFrame(index: number, frame: VideoFrame) {
        this.hexGrid?.pushVideoFrame(index, frame);
    }

    setVideoSlotDimensions(index: number, width: number, height: number) {
        this.hexGrid?.setVideoSlotDimensions(index, width, height);
    }

    setPointerPosition(x: number, y: number) {
        this.pointerHandler.updatePosition(x, y);
    }

    setPressed(isPressed: boolean) {
        this.hexGrid?.setPressed(isPressed);
    }

    setPointerRadiusMul(value: number) {
        this.hexGrid?.setPointerRadiusMul(value);
    }

    onResize([width, height, dpr]: [width: number, height: number, dpr: number]) {
        const currentSize = this.renderer.getSize(new Vector2());
        const currentPr = this.renderer.getPixelRatio();

        if (currentSize.x !== width || currentSize.y !== height || currentPr !== dpr) {
            this.options.width = width;
            this.options.height = height;
            this.options.dpr = dpr;
            this.pointerHandler.updateCanvasDomSize(width, height);
            this.renderer.setPixelRatio(dpr);
            this.renderer.setSize(width, height);
            this.camera.aspect = width / height;
            this.camera.position.z = computeCameraZForMinSide(width, height);
            this.camera.updateProjectionMatrix();

            if (this.hexGrid) {
                this.hexGrid.resizeToViewport(this.getVisibleWorldSize());
            }
        }
    }

    private getVisibleWorldSize(): Vector2 {
        const visibleHeight = 2 * Math.tan((this.camera.fov * Math.PI) / 360) * this.camera.position.z;
        const visibleWidth = visibleHeight * this.camera.aspect;

        return new Vector2(visibleWidth, visibleHeight);
    }

    async render() {
        this.statsProfiler?.begin();

        try {
            this.clock.update();
            const elapsedTime = this.clock.getElapsed();
            const delta = Math.min(elapsedTime - this.prevTime, 0.1);

            this.prevTime = elapsedTime;

            if (this.stats) {
                this.stats.update();
            }

            this.pointerHandler.update(delta);

            if (this.hexGrid) {
                const gridZ = this.hexGrid.group.position.z;
                const gridPlane = new Plane(new Vector3(0, 0, 1), -gridZ);
                const scenePointerAtGridDepth = new Vector3();

                this.pointerHandler.intersectWith(gridPlane, scenePointerAtGridDepth);
                const localPointer = scenePointerAtGridDepth.sub(this.hexGrid.group.position);

                this.hexGrid.updatePointer(localPointer, delta);

                if (this.hexGrid.group.visible) {
                    this.renderer.compute(this.hexGrid.computeUpdate);
                }
            }

            if (this.postProcessing) {
                this.postProcessing.render();
            } else {
                this.renderer.render(this.scene, this.camera);
            }

            if (process.env.NODE_ENV === 'development') {
                this.renderer.resolveTimestampsAsync(TimestampQuery.COMPUTE);
                this.renderer.resolveTimestampsAsync(TimestampQuery.RENDER);
            }
        } finally {
            if (this.statsProfiler) {
                this.statsProfiler.end();
                this.statsProfiler.update();
                this.options.onStatsData?.(this.statsProfiler.getData());
            }
        }
    }

    private initTweakpane() {
        this.tweakPane = new Pane({ title: 'Params' });

        if (this.glowBlurPass) {
            const folder = this.tweakPane.addFolder({ title: 'Glow blur' });

            folder.addBinding(this.glowBlurPass, 'resolutionScale', {
                label: 'Res. scale',
                min: 0.25,
                max: 1,
                step: 0.05,
            });
        }

        if (this.hexGrid) {
            const folder = this.tweakPane.addFolder({ title: 'Hex Grid' });

            this.hexGrid.setupTweaks(folder);
        }
    }

    dispose() {
        this.disposed = true;
        this.renderer.setAnimationLoop(null);
        this.hexGrid?.dispose();
        this.tweakPane?.dispose();
        this.stats?.dom.remove();
        this.statsProfiler?.dispose();

        if (this.renderer.hasInitialized()) {
            this.renderer.dispose();
        }
    }
}

function computeCameraZForMinSide(cssWidth: number, cssHeight: number): number {
    const minSide = Math.max(1, Math.min(cssWidth, cssHeight));
    const z = CAMERA_Z_BASE * (minSide / CAMERA_Z_REF_MIN_SIDE_PX);

    return Math.min(CAMERA_Z_MAX, Math.max(CAMERA_Z_MIN, z));
}
