import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const dir = path.resolve(process.cwd(), 'public/static/videos/video-flow-scrub');

function readManifest(file: string) {
    const buf = readFileSync(path.join(dir, file));

    expect(buf.subarray(0, 40).toString()).not.toContain('git-lfs'); // LFS pointer instead of the binary
    const offset = buf.readUInt32LE(buf.length - 4);

    return JSON.parse(buf.subarray(offset, buf.length - 4).toString());
}

describe('video-flow-scrub .af assets', () => {
    const color = readManifest('underwater2_color.af');
    const flow = readManifest('underwater2_flow.af');

    it('color and flow are frame-synced', () => {
        expect(flow.totalFrames).toBe(color.totalFrames);
        expect(flow.flow.scales).toHaveLength(color.totalFrames);
        expect(flow.flow.sourceFrames).toHaveLength(color.totalFrames);
        expect(color.frames[0].ty).toBe('key');
        expect(flow.frames[0].ty).toBe('key');
    });

    it('flow atlas layout matches the shader', () => {
        const { width, height, cellHeight, atlasWidth, atlasHeight } = flow.flow;

        expect([flow.width, flow.height]).toEqual([atlasWidth, atlasHeight]);
        expect(atlasWidth).toBe(width * 2);
        expect(atlasHeight).toBe(cellHeight * 2);
        expect(height).toBeLessThanOrEqual(cellHeight);
    });
});
