import { uniform } from 'three/tsl';
import { LinearFilter, SRGBColorSpace, UniformNode, VideoFrameTexture, VideoTexture } from 'three/webgpu';
import type { HexGridVideoSlotTexture } from '../types';
import { canUseVideoFrameTexturePipeline, webGpuVideoFrameNeedsCanvasShim } from './video-frame-pipeline';

export type SetupGridVideosOptions = {
    deferSrc?: boolean;
};

export type GridVideoSetup = {
    videos: HTMLVideoElement[];
    videoTextures: HexGridVideoSlotTexture[];
    videoWidths: UniformNode<'float', number>[];
    videoHeights: UniformNode<'float', number>[];
    metadataHandlers: { video: HTMLVideoElement; listener: () => void }[];
    releaseVideoFramePush?: () => void;
};

function pushVideoFramesToTexture(video: HTMLVideoElement, texture: VideoFrameTexture): () => void {
    let active = true;
    let pendingHandle = 0;
    let previousFrame: VideoFrame | undefined;
    const useCanvasShim = webGpuVideoFrameNeedsCanvasShim();
    const canvas = useCanvasShim ? document.createElement('canvas') : undefined;
    let shimCtx: CanvasRenderingContext2D | null = null;

    const schedule = () => {
        pendingHandle = video.requestVideoFrameCallback(() => {
            if (!active) {
                return;
            }

            if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
                try {
                    const frame = new VideoFrame(video);

                    if (useCanvasShim && canvas !== undefined) {
                        const w = frame.displayWidth;
                        const h = frame.displayHeight;

                        if (w > 0 && h > 0) {
                            if (canvas.width !== w || canvas.height !== h) {
                                canvas.width = w;
                                canvas.height = h;
                                shimCtx = canvas.getContext('2d', { alpha: false });
                            } else if (shimCtx === null) {
                                shimCtx = canvas.getContext('2d', { alpha: false });
                            }

                            if (shimCtx !== null) {
                                shimCtx.drawImage(frame, 0, 0, w, h);
                                previousFrame?.close();
                                previousFrame = undefined;
                                frame.close();
                                texture.image = canvas;
                                texture.needsUpdate = true;
                            } else {
                                frame.close();
                            }
                        } else {
                            frame.close();
                        }
                    } else {
                        previousFrame?.close();
                        previousFrame = frame;
                        texture.setFrame(frame);
                    }
                } catch {
                    // see https://github.com/mrdoob/three.js/issues/32391
                }
            }

            if (active) {
                schedule();
            }
        });
    };

    schedule();

    return () => {
        active = false;

        if (pendingHandle !== 0) {
            video.cancelVideoFrameCallback(pendingHandle);
            pendingHandle = 0;
        }

        previousFrame?.close();
        previousFrame = undefined;
    };
}

export function setupGridVideos(videoUrls: string[], options?: SetupGridVideosOptions): GridVideoSetup {
    const deferSrc = options?.deferSrc ?? false;
    const framePushReleases: (() => void)[] = [];

    const createVideoTexture = (url: string) => {
        const video = document.createElement('video');

        if (!deferSrc && url) {
            video.src = url;
        }

        if (deferSrc) {
            video.preload = 'none';
        }

        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        video.crossOrigin = 'anonymous';

        let texture: HexGridVideoSlotTexture;

        if (canUseVideoFrameTexturePipeline()) {
            const frameTexture = new VideoFrameTexture();

            frameTexture.generateMipmaps = false;
            frameTexture.minFilter = LinearFilter;
            frameTexture.colorSpace = SRGBColorSpace;
            texture = frameTexture;
            framePushReleases.push(pushVideoFramesToTexture(video, frameTexture));
        } else {
            texture = new VideoTexture(video);
            texture.generateMipmaps = false;
            texture.minFilter = LinearFilter;
            texture.colorSpace = SRGBColorSpace;
        }

        return { video, texture };
    };

    const videosData = videoUrls.map((url) => createVideoTexture(url));
    const videos = videosData.map((v) => v.video);
    const videoTextures = videosData.map((v) => v.texture);

    const videoWidths = videoUrls.map(() => uniform(1));
    const videoHeights = videoUrls.map(() => uniform(1));

    const metadataHandlers: GridVideoSetup['metadataHandlers'] = [];

    videosData.forEach((vid, index) => {
        const listener = () => {
            const w = vid.video.videoWidth;
            const h = vid.video.videoHeight;

            if (w > 0 && h > 0) {
                videoWidths[index]!.value = w;
                videoHeights[index]!.value = h;
            }
        };

        vid.video.addEventListener('loadedmetadata', listener);
        metadataHandlers.push({ video: vid.video, listener });
    });

    return {
        videos,
        videoTextures,
        videoWidths,
        videoHeights,
        metadataHandlers,
        releaseVideoFramePush:
            framePushReleases.length > 0
                ? () => {
                      for (const release of framePushReleases) {
                          release();
                      }

                      framePushReleases.length = 0;
                  }
                : undefined,
    };
}
