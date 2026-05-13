import { uniform } from 'three/tsl';
import { LinearFilter, SRGBColorSpace, UniformNode, VideoFrameTexture, VideoTexture } from 'three/webgpu';
import { canUseVideoFrameTexturePipeline } from './video-frame-pipeline';

export type SetupGridVideosOptions = {
    deferSrc?: boolean;
};

export type GridVideoSetup = {
    videos: HTMLVideoElement[];
    videoTextures: VideoTexture[];
    videoWidths: UniformNode<'float', number>[];
    videoHeights: UniformNode<'float', number>[];
    metadataHandlers: { video: HTMLVideoElement; listener: () => void }[];
    releaseVideoFramePush?: () => void;
};

function pushVideoFramesToTexture(video: HTMLVideoElement, texture: VideoFrameTexture): () => void {
    let active = true;
    let pendingHandle = 0;
    let previousFrame: VideoFrame | undefined;

    const schedule = () => {
        pendingHandle = video.requestVideoFrameCallback(() => {
            if (!active) {
                return;
            }

            if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
                try {
                    const frame = new VideoFrame(video);

                    previousFrame?.close();
                    previousFrame = frame;
                    texture.setFrame(frame);
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

        let texture: VideoTexture;

        if (canUseVideoFrameTexturePipeline()) {
            const frameTexture = new VideoFrameTexture();

            frameTexture.generateMipmaps = false;
            frameTexture.minFilter = LinearFilter;
            frameTexture.colorSpace = SRGBColorSpace;
            texture = frameTexture as unknown as VideoTexture;
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
