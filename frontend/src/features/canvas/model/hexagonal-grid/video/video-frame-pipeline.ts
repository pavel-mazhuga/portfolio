export function canUseVideoFrameTexturePipeline(): boolean {
    return (
        typeof VideoFrame !== 'undefined' && typeof HTMLVideoElement.prototype.requestVideoFrameCallback === 'function'
    );
}
