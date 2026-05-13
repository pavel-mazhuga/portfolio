import { canUseVideoFrameTexturePipeline } from './hexagonal-grid/video/video-frame-pipeline';

type WorkerLike = {
    postMessage(message: unknown, transfer?: Transferable[]): void;
};

export class GridVideoBridge {
    private readonly videos: HTMLVideoElement[] = [];
    private readonly releases: (() => void)[] = [];
    private disposed = false;

    constructor(
        private readonly worker: WorkerLike,
        slotCount: number,
    ) {
        if (!canUseVideoFrameTexturePipeline()) {
            throw new Error('GridVideoBridge requires VideoFrame + requestVideoFrameCallback');
        }

        for (let i = 0; i < slotCount; i++) {
            const video = document.createElement('video');

            video.loop = true;
            video.muted = true;
            video.playsInline = true;
            video.crossOrigin = 'anonymous';
            video.preload = 'none';
            this.videos.push(video);

            const textureIndex = i;
            const pushLoop = this.createRvfcLoop(video, textureIndex);

            this.releases.push(pushLoop);

            video.addEventListener('loadedmetadata', () => {
                if (this.disposed) return;
                this.worker.postMessage({
                    message: 'videoMetadata',
                    payload: {
                        index: textureIndex,
                        width: video.videoWidth,
                        height: video.videoHeight,
                    },
                });
            });
        }
    }

    private createRvfcLoop(video: HTMLVideoElement, textureIndex: number): () => void {
        let active = true;
        let pendingHandle = 0;

        const schedule = () => {
            pendingHandle = video.requestVideoFrameCallback(() => {
                if (!active || this.disposed) {
                    return;
                }

                if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
                    try {
                        const frame = new VideoFrame(video);

                        this.worker.postMessage(
                            {
                                message: 'videoFrame',
                                payload: { index: textureIndex, frame },
                            },
                            [frame],
                        );
                    } catch {
                        // see https://github.com/mrdoob/three.js/issues/32391
                    }
                }

                if (active && !this.disposed) {
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
        };
    }

    syncVideoUrls(urls: string[]): void {
        if (this.disposed || urls.length === 0) return;

        for (let i = 0; i < this.videos.length; i++) {
            const url = urls[i];
            const video = this.videos[i];

            if (!url || !video || video.src) {
                continue;
            }
            video.src = url;
        }
    }

    playOnly(index: number): void {
        if (this.disposed) return;

        for (let i = 0; i < this.videos.length; i++) {
            const video = this.videos[i];

            if (i === index) {
                void video.play().catch(() => {});
            } else {
                video.pause();
            }
        }
    }

    ensurePlaying(index: number): void {
        if (this.disposed) return;

        const video = this.videos[index];

        if (video) {
            void video.play().catch(() => {});
        }
    }

    pauseAll(): void {
        if (this.disposed) return;

        for (const video of this.videos) {
            video.pause();
        }
    }

    dispose(): void {
        if (this.disposed) return;
        this.disposed = true;

        for (const release of this.releases) {
            release();
        }
        this.releases.length = 0;

        for (const video of this.videos) {
            video.pause();
            video.src = '';
            video.load();
        }
        this.videos.length = 0;
    }
}
