import type { InstancedMesh, StorageBufferNode } from 'three/webgpu';
import { SLIDE_CENTER_PHYSICS_MS, SLIDE_WAVE_DURATION_MS } from '../constants';
import { markStorageCpuWrite } from '../gpu/mark-storage-cpu-write';
import { secondsToReachHalfFlip, smoothDelay01 } from '../lib/flip-timing';

export type SlideWaveDeps = {
    mesh: InstancedMesh;
    isCentralData: Float32Array;
    initialPositionsData: Float32Array;
    targetAngleStorage: StorageBufferNode<'float'>;
    frontVideoIndexStorage: StorageBufferNode<'float'>;
    backVideoIndexStorage: StorageBufferNode<'float'>;
    getFlipSpeed: () => number;
};

export class SlideWaveController {
    private readonly timeouts: NodeJS.Timeout[] = [];
    slideCenterBoostUntil = 0;

    constructor(private readonly deps: SlideWaveDeps) {}

    clearTimeouts(): void {
        for (const id of this.timeouts) {
            clearTimeout(id);
        }

        this.timeouts.length = 0;
    }

    startWave(currentVideoIndex: number): void {
        this.slideCenterBoostUntil = performance.now() + SLIDE_CENTER_PHYSICS_MS;

        const instCount = this.deps.mesh.count;
        const targetVideo = currentVideoIndex;

        const central: { index: number; dist: number }[] = [];

        for (let i = 0; i < instCount; i++) {
            if (this.deps.isCentralData[i] < 0.5) continue;

            const x = this.deps.initialPositionsData[i * 3 + 0];
            const y = this.deps.initialPositionsData[i * 3 + 1];

            central.push({ index: i, dist: Math.hypot(x, y) });
        }

        if (central.length === 0) return;

        central.sort((a, b) => a.dist - b.dist);
        const maxDist = Math.max(central[central.length - 1].dist, 1e-6);

        for (const { index, dist } of central) {
            const normalized = dist / maxDist;
            const delayMs = smoothDelay01(normalized) * SLIDE_WAVE_DURATION_MS;

            this.scheduleFlip(delayMs, index, targetVideo);
        }
    }

    private scheduleFlip(delayMs: number, instanceIdx: number, targetVideo: number): void {
        const id = setTimeout(() => {
            const idx = this.timeouts.indexOf(id);

            if (idx !== -1) {
                this.timeouts.splice(idx, 1);
            }

            this.applyFlipAtInstance(instanceIdx, targetVideo);
        }, delayMs);

        this.timeouts.push(id);
    }

    private applyFlipAtInstance(i: number, targetVideo: number): void {
        const targetAngles = this.deps.targetAngleStorage.value?.array as Float32Array | undefined;

        if (!targetAngles) return;

        const angleBefore = targetAngles[i];
        const isFront = Math.round(angleBefore / Math.PI) % 2 === 0;

        targetAngles[i] += Math.PI;
        markStorageCpuWrite(this.deps.targetAngleStorage);

        const flipSpeed = this.deps.getFlipSpeed();
        const swapDelayMs = Math.round(secondsToReachHalfFlip(flipSpeed, 1 / 60) * 1000);

        const swapId = setTimeout(() => {
            const idx = this.timeouts.indexOf(swapId);

            if (idx !== -1) {
                this.timeouts.splice(idx, 1);
            }

            const backArr = this.deps.backVideoIndexStorage.value?.array as Float32Array | undefined;
            const frontArr = this.deps.frontVideoIndexStorage.value?.array as Float32Array | undefined;

            if (!backArr || !frontArr) return;

            if (isFront) {
                backArr[i] = targetVideo;
                markStorageCpuWrite(this.deps.backVideoIndexStorage);
            } else {
                frontArr[i] = targetVideo;
                markStorageCpuWrite(this.deps.frontVideoIndexStorage);
            }
        }, swapDelayMs);

        this.timeouts.push(swapId);
    }
}
