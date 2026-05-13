import type { StatsData } from 'stats-gl';
import type { GridVideoPlayback } from './hexagonal-grid/interaction/project-mode';

export type GridRouteState = {
    isProjectsPage: boolean;
    videoUrls: string[];
};

export type CanvasData = {
    isWorker: boolean;
    canvas: HTMLCanvasElement | OffscreenCanvas;
    dpr: number;
    width: number;
    height: number;
    isDebug: boolean;
    useCoarsePointer: boolean;
    videoPlayback?: GridVideoPlayback;
    onInitialized?: () => void;
    onStatsData?: (data: StatsData) => void;
};

export type { GridVideoPlayback };

export interface IWorld {
    onResize: (params: [width: number, height: number, dpr: number]) => void;
    setPointerPosition: (x: number, y: number) => void;
    setPressed: (isPressed: boolean) => void;
    setPointerRadiusMul: (value: number) => void;
    applyRouteState: (state: GridRouteState) => void;
    prevSlide: () => void;
    nextSlide: () => void;
    dispose: () => void;
}
