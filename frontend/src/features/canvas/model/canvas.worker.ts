/// <reference lib="webworker" />
import { World } from './World';
import type { CanvasData, GridRouteState } from './types';

type InitPayload = Omit<CanvasData, 'isWorker' | 'videoPlayback' | 'onInitialized' | 'onStatsData'> & {
    isWorker: boolean;
    canvas: OffscreenCanvas;
    testCanvas: OffscreenCanvas;
};

let world: World | undefined;

const videoPlayback = {
    playOnly: (index: number) =>
        postMessage({ message: 'hexVideoPlayback', payload: { action: 'playOnly' as const, index } }),
    ensurePlaying: (index: number) =>
        postMessage({ message: 'hexVideoPlayback', payload: { action: 'ensurePlaying' as const, index } }),
    pauseAll: () => postMessage({ message: 'hexVideoPlayback', payload: { action: 'pauseAll' as const } }),
};

self.onmessage = async (event: MessageEvent<{ message: string; payload?: unknown }>) => {
    const { message, payload } = event.data;

    switch (message) {
        case 'init': {
            if (!payload || typeof payload !== 'object') {
                return;
            }

            const p = payload as InitPayload;

            if (!(p.canvas instanceof OffscreenCanvas) || !(p.testCanvas instanceof OffscreenCanvas)) {
                postMessage({ message: 'webgpu-error' });

                return;
            }

            try {
                const adapter = await navigator.gpu?.requestAdapter?.();

                if (!adapter) {
                    postMessage({ message: 'webgpu-error' });

                    return;
                }
            } catch {
                postMessage({ message: 'webgpu-error' });

                return;
            }

            const { testCanvas, ...rest } = p;

            world = new World({
                ...rest,
                isWorker: true,
                videoPlayback,
                onInitialized: () => postMessage({ message: 'ready' }),
                onStatsData:
                    process.env.NODE_ENV === 'development'
                        ? (data) => postMessage({ message: 'stats', payload: data })
                        : undefined,
            });
            break;
        }

        case 'resize': {
            world?.onResize(payload as [number, number, number]);
            break;
        }

        case 'setPointerPosition': {
            const pl = payload as { x: number; y: number };

            world?.setPointerPosition(pl.x, pl.y);
            break;
        }

        case 'setPressed': {
            const pl = payload as { isPressed: boolean };

            world?.setPressed(pl.isPressed);
            break;
        }

        case 'setPointerRadiusMul': {
            const pl = payload as { value: number };

            world?.setPointerRadiusMul(pl.value);
            break;
        }

        case 'applyRouteState': {
            const pl = payload as Pick<GridRouteState, 'isProjectsPage'>;

            world?.applyRouteState({
                isProjectsPage: pl.isProjectsPage,
                videoUrls: [],
            });
            break;
        }

        case 'prevSlide': {
            world?.prevSlide();
            break;
        }

        case 'nextSlide': {
            world?.nextSlide();
            break;
        }

        case 'videoFrame': {
            const pl = payload as { index: number; frame: VideoFrame };

            world?.pushVideoFrame(pl.index, pl.frame);
            break;
        }

        case 'videoMetadata': {
            const pl = payload as { index: number; width: number; height: number };

            world?.setVideoSlotDimensions(pl.index, pl.width, pl.height);
            break;
        }

        case 'dispose': {
            world?.dispose();
            world = undefined;
            break;
        }

        default:
            break;
    }
};
