import { uniform } from 'three/tsl';
import { LinearFilter, SRGBColorSpace, UniformNode, VideoFrameTexture } from 'three/webgpu';

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
