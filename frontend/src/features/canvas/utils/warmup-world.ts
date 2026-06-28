import type { Camera, Scene, WebGPURenderer } from 'three/webgpu';

const DEFAULT_WARMUP_FRAMES = 24;

type CompilablePass = {
    compileAsync: (renderer: WebGPURenderer) => Promise<void>;
};

export type WarmupWorldTargets = {
    renderer: WebGPURenderer;
    scene: Scene;
    camera: Camera;
    scenePass?: CompilablePass;
    runCompute?: () => void;
    renderFrame: () => Promise<void>;
};

export type WarmupWorldOptions = {
    frameCount?: number;
    debug?: boolean;
};

export async function warmupWorld(targets: WarmupWorldTargets, options: WarmupWorldOptions = {}): Promise<void> {
    const frameCount = options.frameCount ?? DEFAULT_WARMUP_FRAMES;
    const debug = options.debug ?? false;
    const startedAt = performance.now();

    const log = (message: string) => {
        if (!debug) {
            return;
        }

        // eslint-disable-next-line no-console -- opt-in timing via ?debug
        console.info(`[canvas:warmup] ${message}`);
    };

    log('compile scene');
    await targets.renderer.compileAsync(targets.scene, targets.camera);

    if (targets.scenePass) {
        log('compile scene pass (MRT)');
        await targets.scenePass.compileAsync(targets.renderer);
    }

    if (targets.runCompute) {
        log('compute');
        targets.runCompute();
    }

    log(`render ${frameCount} warmup frames`);

    for (let frame = 0; frame < frameCount; frame++) {
        await targets.renderFrame();
    }

    if (frameCount === 0) {
        log('compile-only warmup (frames run in animation loop)');
    }

    log(`done in ${(performance.now() - startedAt).toFixed(0)}ms`);
}
