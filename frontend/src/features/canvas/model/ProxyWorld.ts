import Stats, { type StatsData } from 'stats-gl';
// eslint-disable-next-line fsd/layer-import-restrictions
import { projects } from '@/app/data/projects';
import { resolveProjectVideoUrlFromSources } from '../utils/resolve-project-video-url';
import type { World } from './World';
import { GridVideoBridge } from './grid-video-bridge';
import { canUseVideoFrameTexturePipeline } from './hexagonal-grid/video/video-frame-pipeline';
import type { GridRouteState, IWorld } from './types';

export type ProxyWorldInitParams = {
    canvas: HTMLCanvasElement;
    dpr: number;
    width: number;
    height: number;
    isDebug: boolean;
    skipWarmup?: boolean;
    useCoarsePointer: boolean;
};

export class ProxyWorld implements IWorld {
    private worker?: Worker;
    private world?: World;
    private bridge?: GridVideoBridge;
    private canvasEl: HTMLCanvasElement;
    private readonly initParams: ProxyWorldInitParams;
    private workerStats?: Stats;
    private workerStatsRaf = 0;

    constructor(
        params: ProxyWorldInitParams,
        forceMainThread: boolean,
        private readonly onReady?: () => void,
    ) {
        this.initParams = params;
        this.canvasEl = params.canvas;

        const supportsOffscreen = 'OffscreenCanvas' in window && 'createImageBitmap' in window;
        const useWorker = !forceMainThread && supportsOffscreen && canUseVideoFrameTexturePipeline();

        const initFallback = (canvas?: HTMLCanvasElement) => {
            const c = canvas ?? this.canvasEl;

            void import('./World').then(({ World: WorldCtor }) => {
                this.world = new WorldCtor({
                    ...params,
                    isWorker: false,
                    canvas: c,
                    onInitialized: () => {
                        this.onReady?.();
                    },
                });
            });
        };

        if (useWorker) {
            this.worker = new Worker(new URL('./canvas.worker.ts', import.meta.url), { type: 'module' });
            const offscreen = params.canvas.transferControlToOffscreen();
            const testOffscreen = document.createElement('canvas').transferControlToOffscreen();
            const { canvas: _omit, ...rest } = params;

            this.worker.postMessage(
                {
                    message: 'init',
                    payload: {
                        ...rest,
                        isWorker: true,
                        canvas: offscreen,
                        testCanvas: testOffscreen,
                    },
                },
                [offscreen, testOffscreen],
            );

            this.worker.addEventListener('message', this.#onWorkerMessage);

            if (process.env.NODE_ENV === 'development') {
                this.#startWorkerStatsOverlay();
            }
        } else {
            initFallback();
        }
    }

    #onWorkerMessage = (ev: MessageEvent<{ message: string; payload?: unknown }>) => {
        const { message, payload } = ev.data ?? {};

        switch (message) {
            case 'ready': {
                if (this.worker) {
                    this.bridge = new GridVideoBridge(this.worker, projects.length);
                }

                this.onReady?.();
                break;
            }

            case 'webgpu-error': {
                this.#teardownWorkerOnly();
                const prev = this.canvasEl;
                const newCanvas = document.createElement('canvas');

                newCanvas.className = prev.className;
                prev.insertAdjacentElement('afterend', newCanvas);
                prev.remove();
                this.canvasEl = newCanvas;
                void import('./World').then(({ World: WorldCtor }) => {
                    this.world = new WorldCtor({
                        ...this.initParams,
                        isWorker: false,
                        canvas: newCanvas,
                        onInitialized: () => {
                            this.onReady?.();
                        },
                    });
                });
                break;
            }

            case 'hexVideoPlayback': {
                const pl = payload as { action?: string; index?: number };

                if (pl.action === 'playOnly' && typeof pl.index === 'number') {
                    this.bridge?.playOnly(pl.index);
                }

                if (pl.action === 'ensurePlaying' && typeof pl.index === 'number') {
                    this.bridge?.ensurePlaying(pl.index);
                }

                if (pl.action === 'pauseAll') {
                    this.bridge?.pauseAll();
                }

                break;
            }

            case 'stats': {
                this.workerStats?.setData(ev.data.payload as StatsData);
                break;
            }

            default:
                break;
        }
    };

    #startWorkerStatsOverlay() {
        this.workerStats = new Stats({
            trackGPU: true,
            trackCPT: true,
        });
        this.workerStats.domElement.classList.add('stats-gl');
        document.body.appendChild(this.workerStats.dom);

        const tick = () => {
            this.workerStats?.update();
            this.workerStatsRaf = requestAnimationFrame(tick);
        };

        this.workerStatsRaf = requestAnimationFrame(tick);
    }

    #stopWorkerStatsOverlay() {
        if (this.workerStatsRaf !== 0) {
            cancelAnimationFrame(this.workerStatsRaf);
            this.workerStatsRaf = 0;
        }

        this.workerStats?.dispose();
        this.workerStats = undefined;
    }

    #teardownWorkerOnly() {
        if (process.env.NODE_ENV === 'development') {
            this.#stopWorkerStatsOverlay();
        }

        if (this.worker) {
            this.worker.removeEventListener('message', this.#onWorkerMessage);
            this.worker.postMessage({ message: 'dispose' });
            this.worker.terminate();
            this.worker = undefined;
        }

        this.bridge?.dispose();
        this.bridge = undefined;
    }

    onResize(params: [width: number, height: number, dpr: number]) {
        if (this.worker) {
            this.worker.postMessage({ message: 'resize', payload: params });
        } else {
            this.world?.onResize(params);
        }
    }

    setPointerPosition(x: number, y: number) {
        if (this.worker) {
            this.worker.postMessage({ message: 'setPointerPosition', payload: { x, y } });
        } else {
            this.world?.setPointerPosition(x, y);
        }
    }

    setPressed(isPressed: boolean) {
        if (this.worker) {
            this.worker.postMessage({ message: 'setPressed', payload: { isPressed } });
        } else {
            this.world?.setPressed(isPressed);
        }
    }

    setPointerRadiusMul(value: number) {
        if (this.worker) {
            this.worker.postMessage({ message: 'setPointerRadiusMul', payload: { value } });
        } else {
            this.world?.setPointerRadiusMul(value);
        }
    }

    prewarmAllRoutes() {
        if (this.worker) {
            this.worker.postMessage({ message: 'prewarmAllRoutes' });
        } else {
            this.world?.prewarmAllRoutes();
        }
    }

    prefetchProjectsRoute() {
        const urls = this.#resolveProjectVideoUrls({ isProjectsPage: true, videoUrls: [] });

        this.bridge?.syncVideoUrls(urls);

        if (this.worker) {
            this.worker.postMessage({ message: 'prefetchProjectsRoute' });
        } else {
            this.world?.prefetchProjectsRoute();
        }
    }

    prefetchHomeRoute() {
        if (this.worker) {
            this.worker.postMessage({ message: 'prefetchHomeRoute' });
        } else {
            this.world?.prefetchHomeRoute();
        }
    }

    suspend() {
        if (this.worker) {
            this.worker.postMessage({ message: 'suspend' });
        } else {
            this.world?.suspend();
        }
    }

    resume() {
        if (this.worker) {
            this.worker.postMessage({ message: 'resume' });
        } else {
            this.world?.resume();
        }
    }

    applyRouteState(state: GridRouteState) {
        const videoUrls = this.#resolveProjectVideoUrls(state);

        if (state.isProjectsPage && videoUrls.length > 0) {
            this.bridge?.syncVideoUrls(videoUrls);
        }

        if (this.worker) {
            this.worker.postMessage({
                message: 'applyRouteState',
                payload: { isProjectsPage: state.isProjectsPage },
            });
        } else {
            this.world?.applyRouteState(state);
        }
    }

    #resolveProjectVideoUrls(state: GridRouteState): string[] {
        if (!state.isProjectsPage) {
            return [];
        }

        if (state.videoUrls.length > 0) {
            return state.videoUrls;
        }

        return projects.map((project) => resolveProjectVideoUrlFromSources(project.video));
    }

    prevSlide() {
        if (this.worker) {
            this.worker.postMessage({ message: 'prevSlide' });
        } else {
            this.world?.prevSlide();
        }
    }

    nextSlide() {
        if (this.worker) {
            this.worker.postMessage({ message: 'nextSlide' });
        } else {
            this.world?.nextSlide();
        }
    }

    dispose() {
        this.#teardownWorkerOnly();
        this.world?.dispose();
        this.world = undefined;
    }
}
