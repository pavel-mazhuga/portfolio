export function canUseVideoFrameTexturePipeline(): boolean {
    return (
        typeof VideoFrame !== 'undefined' && typeof HTMLVideoElement.prototype.requestVideoFrameCallback === 'function'
    );
}

/**
 * Firefox WebGPU: `copyExternalImageToTexture` from {@link VideoFrame} often fails (silent empty catch in three.js).
 * Rasterize frame to canvas first; same path as stable `VideoTexture` upload.
 */
export function webGpuVideoFrameNeedsCanvasShim(): boolean {
    return typeof navigator !== 'undefined' && /firefox/i.test(navigator.userAgent);
}
