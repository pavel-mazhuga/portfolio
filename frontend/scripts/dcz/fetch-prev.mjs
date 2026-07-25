import fs from 'node:fs';
import path from 'node:path';
import { sha256 } from './encode.mjs';

const ROOT = path.join(import.meta.dirname, '../..');
const PREV_DIR = path.join(ROOT, '.dcz-prev/_astro');
const ORIGIN = (process.env.DCZ_PREV_ORIGIN || process.env.HOST || '').replace(/\/$/, '');
const CONCURRENCY = 8;
const TIMEOUT = 20_000;

if (!ORIGIN) {
    console.warn('[dcz] neither DCZ_PREV_ORIGIN nor HOST is set, skipping previous build download');
    process.exit(0);
}

const get = async (url) => {
    const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT) });

    if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText} for ${url}`);
    }

    return Buffer.from(await response.arrayBuffer());
};

let manifest;

try {
    manifest = JSON.parse((await get(`${ORIGIN}/_astro/dcz-manifest.json`)).toString());
} catch (error) {
    console.warn(`[dcz] no usable manifest at ${ORIGIN}: ${error.message}`);
    process.exit(0);
}

fs.rmSync(PREV_DIR, { recursive: true, force: true });
fs.mkdirSync(PREV_DIR, { recursive: true });

const queue = manifest.assets.filter(({ name }) => !name.includes('/'));
const failed = [];

const worker = async () => {
    let asset;

    while ((asset = queue.shift())) {
        try {
            const data = await get(`${ORIGIN}/_astro/${asset.name}`);

            // The dcz header carries the SHA-256 of the dictionary, so a corrupted download
            // would make clients reject the variant instead of silently degrading.
            if (sha256(data).toString('hex') !== asset.sha256) {
                throw new Error('checksum mismatch');
            }

            fs.writeFileSync(path.join(PREV_DIR, asset.name), data);
        } catch (error) {
            failed.push(`${asset.name}: ${error.message}`);
        }
    }
};

await Promise.all(Array.from({ length: CONCURRENCY }, worker));

const downloaded = fs.readdirSync(PREV_DIR).length;

console.log(`[dcz] downloaded ${downloaded}/${manifest.assets.length} previous assets from ${ORIGIN}`);

if (failed.length > 0) {
    console.warn(`[dcz] skipped ${failed.length} assets:\n  ${failed.slice(0, 10).join('\n  ')}`);
}
