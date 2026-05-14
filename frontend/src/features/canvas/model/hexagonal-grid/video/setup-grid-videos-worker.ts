import { uniform } from 'three/tsl';
import { LinearFilter, SRGBColorSpace, UniformNode, VideoFrameTexture } from 'three/webgpu';
import { webGpuVideoFrameNeedsCanvasShim } from './video-frame-pipeline';

export type GridVideoWorkerSetup = {
    videoTextures: VideoFrameTexture[];
    videoWidths: UniformNode<'float', number>[];
    videoHeights: UniformNode<'float', number>[];
    pushFrame: (index: number, frame: VideoFrame) => void;
    setVideoDimensions: (index: number, width: number, height: number) => void;
    dispose: () => void;
};

export function setupGridVideosForWorker(slotCount: number): GridVideoWorkerSetup {
    const previousFrames: (VideoFrame | undefined)[] = Array.from({ length: slotCount }, () => undefined);
    const useCanvasShim = webGpuVideoFrameNeedsCanvasShim();
    const shimCanvases: OffscreenCanvas[] | undefined = useCanvasShim
        ? Array.from({ length: slotCount }, () => new OffscreenCanvas(1, 1))
        : undefined;
    const shimCtxs: (OffscreenCanvasRenderingContext2D | null)[] | undefined = useCanvasShim
        ? Array.from({ length: slotCount }, () => null)
        : undefined;

    const videoTextures: VideoFrameTexture[] = [];

    for (let i = 0; i < slotCount; i++) {
        const frameTexture = new VideoFrameTexture();

        frameTexture.generateMipmaps = false;
        frameTexture.minFilter = LinearFilter;
        frameTexture.colorSpace = SRGBColorSpace;
        videoTextures.push(frameTexture);
    }

    const videoWidths = Array.from({ length: slotCount }, () => uniform(1));
    const videoHeights = Array.from({ length: slotCount }, () => uniform(1));

    const pushFrame = (index: number, frame: VideoFrame) => {
        const texture = videoTextures[index];

        if (texture === undefined) {
            frame.close();

            return;
        }

        if (useCanvasShim && shimCanvases !== undefined && shimCtxs !== undefined) {
            const w = frame.displayWidth;
            const h = frame.displayHeight;

            if (w > 0 && h > 0) {
                const canvas = shimCanvases[index]!;
                let ctx = shimCtxs[index];

                if (canvas.width !== w || canvas.height !== h) {
                    canvas.width = w;
                    canvas.height = h;
                    ctx = canvas.getContext('2d', { alpha: false });
                    shimCtxs[index] = ctx;
                } else if (ctx === null) {
                    ctx = canvas.getContext('2d', { alpha: false });
                    shimCtxs[index] = ctx;
                }

                if (ctx !== null) {
                    ctx.drawImage(frame, 0, 0, w, h);
                    previousFrames[index]?.close();
                    previousFrames[index] = undefined;
                    frame.close();
                    texture.image = canvas;
                    texture.needsUpdate = true;
                } else {
                    frame.close();
                }
            } else {
                frame.close();
            }

            return;
        }

        previousFrames[index]?.close();
        previousFrames[index] = frame;
        texture.setFrame(frame);
    };

    const setVideoDimensions = (index: number, width: number, height: number) => {
        if (index < 0 || index >= slotCount) return;

        if (width > 0 && height > 0) {
            videoWidths[index]!.value = width;
            videoHeights[index]!.value = height;
        }
    };

    const dispose = () => {
        for (let i = 0; i < previousFrames.length; i++) {
            previousFrames[i]?.close();
            previousFrames[i] = undefined;
        }

        for (const tex of videoTextures) {
            tex.dispose();
        }
    };

    return {
        videoTextures,
        videoWidths,
        videoHeights,
        pushFrame,
        setVideoDimensions,
        dispose,
    };
}
