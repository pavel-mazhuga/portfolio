/**
 * Minimal TypeScript port of ActiveFrame (https://github.com/activetheory/activeframe, MIT, Active Theory).
 * Differences from the original runtime:
 * - the decoded VideoFrame is handed to `onFrame` and the caller owns it (must `close()` it),
 *   so it can be kept alive until it is uploaded together with frames from other files;
 * - the "decode just the next delta" shortcut checks the last chunk actually fed to the decoder,
 *   not the last frame shown (the original could append a delta after an unrelated GOP).
 */

export type AfFrameMeta = {
    o: number;
    l: number;
    t: number;
    ty: 'key' | 'delta';
    i: number;
};

export type AfManifest = {
    codec: string;
    width: number;
    height: number;
    totalFrames: number;
    description: string;
    frames: AfFrameMeta[];
    [key: string]: unknown;
};

type AfFile = { manifest: AfManifest; data: ArrayBuffer };

const fileCache = new Map<string, Promise<AfFile>>();

export function loadAf(url: string): Promise<AfFile> {
    let file = fileCache.get(url);

    if (!file) {
        file = fetch(url)
            .then((res) => {
                if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);

                return res.arrayBuffer();
            })
            .then((data) => {
                // last 4 bytes: LE uint32 offset of the JSON manifest
                const manifestOffset = new DataView(data, data.byteLength - 4).getUint32(0, true);
                const json = new TextDecoder().decode(
                    new Uint8Array(data, manifestOffset, data.byteLength - 4 - manifestOffset),
                );

                return { manifest: JSON.parse(json) as AfManifest, data };
            });
        file.catch(() => fileCache.delete(url));
        fileCache.set(url, file);
    }

    return file;
}

export class ActiveFramePlayer {
    manifest!: AfManifest;
    private chunks: Uint8Array[] = [];
    private decoder?: VideoDecoder;
    private config?: VideoDecoderConfig;
    private indexByTimestamp = new Map<number, number>();
    private desired = -1;
    private lastFed = -1;
    private disposed = false;

    constructor(
        private readonly url: string,
        private readonly onFrame: (frame: VideoFrame, index: number) => void,
    ) {}

    async init() {
        const { manifest, data } = await loadAf(this.url);

        this.manifest = manifest;
        this.chunks = manifest.frames.map((f) => new Uint8Array(data, f.o, f.l));
        manifest.frames.forEach((f) => this.indexByTimestamp.set(f.t, f.i));

        const description = Uint8Array.from(atob(manifest.description), (c) => c.charCodeAt(0));
        const base: VideoDecoderConfig = {
            codec: manifest.codec,
            codedWidth: manifest.width,
            codedHeight: manifest.height,
            colorSpace: { primaries: 'bt709', transfer: 'bt709', matrix: 'bt709', fullRange: false },
            description,
        };
        const candidates: VideoDecoderConfig[] = [
            { ...base, hardwareAcceleration: 'prefer-hardware', optimizeForLatency: true },
            { ...base, optimizeForLatency: true },
            base,
        ];

        for (const candidate of candidates) {
            if ((await VideoDecoder.isConfigSupported(candidate)).supported) {
                this.config = candidate;
                break;
            }
        }

        if (!this.config) throw new Error(`Decoder not supported for ${manifest.codec}`);

        if (this.disposed) return;

        this.decoder = new VideoDecoder({
            output: (frame) => {
                const index = this.indexByTimestamp.get(frame.timestamp);

                if (this.disposed || index !== this.desired) {
                    frame.close();

                    return;
                }

                this.onFrame(frame, index);
            },
            // eslint-disable-next-line no-console
            error: (e) => console.error(`[af] ${this.url}`, e),
        });
        this.decoder.configure(this.config);
    }

    private feed(index: number) {
        const meta = this.manifest.frames[index];

        this.decoder!.decode(new EncodedVideoChunk({ type: meta.ty, timestamp: meta.t, data: this.chunks[index] }));
        this.lastFed = index;
    }

    setFrame(index: number) {
        if (!this.decoder || this.disposed) return;

        const target = Math.min(Math.max(Math.round(index), 0), this.manifest.totalFrames - 1);

        if (target === this.desired) return;

        this.desired = target;
        const frames = this.manifest.frames;

        if (target === this.lastFed + 1 && frames[target].ty === 'delta' && this.decoder.state === 'configured') {
            this.feed(target);

            return;
        }

        if (this.decoder.decodeQueueSize > 0 || this.decoder.state !== 'configured') {
            this.decoder.reset();
            this.decoder.configure(this.config!);
        }

        let key = target;

        while (key > 0 && frames[key].ty !== 'key') key--;

        for (let i = key; i <= target; i++) this.feed(i);
    }

    destroy() {
        this.disposed = true;

        if (this.decoder && this.decoder.state !== 'closed') this.decoder.close();

        this.decoder = undefined;
        fileCache.delete(this.url);
    }
}
