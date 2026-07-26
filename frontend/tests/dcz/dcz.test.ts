/* eslint-disable import/no-internal-modules -- build scripts have no public API barrel */
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
    DCZ_HEADER_SIZE,
    dczVariantName,
    decodeDcz,
    encodeDcz,
    isZstdAvailable,
    parseAssetName,
    sha256,
} from '../../scripts/dcz/encode.mjs';

const ASTRO_DIR = path.join(process.cwd(), 'build/_astro');
const PREV_DIR = path.join(process.cwd(), '.dcz-prev/_astro');
const VARIANT_RE = /^(?<target>.+\.(?:js|css))\.(?<dictHash>[A-Za-z0-9_-]{8})\.dcz\.(?:js|css)$/;

const findDictionary = (hash: string, ext: string): Buffer | null => {
    for (const dir of [ASTRO_DIR, PREV_DIR]) {
        if (!fs.existsSync(dir)) continue;

        const name = fs.readdirSync(dir).find((entry) => {
            const groups = parseAssetName(entry);

            return groups?.hash === hash && groups.ext === ext;
        });

        if (name) return fs.readFileSync(path.join(dir, name));
    }

    return null;
};

describe.skipIf(!isZstdAvailable)('dcz encoding', () => {
    const dictionary = Buffer.from('{"type":"event","source":"server-2","status":"active"}');
    const data = Buffer.from('{"type":"event","source":"server-1","status":"inactive"}');

    it('round-trips through the dictionary', () => {
        const stream = encodeDcz(data, dictionary);

        expect(decodeDcz(stream, dictionary)).toEqual(data);
    });

    it('carries the dictionary hash in the RFC 9842 header', () => {
        const stream = encodeDcz(data, dictionary);

        expect(stream.subarray(0, 8).toString('hex')).toBe('5e2a4d1820000000');
        expect(stream.subarray(8, DCZ_HEADER_SIZE)).toEqual(sha256(dictionary));
    });

    it('rejects a stream compressed with another dictionary', () => {
        const stream = encodeDcz(data, dictionary);

        expect(() => decodeDcz(stream, Buffer.from('something else'))).toThrow(/different dictionary/);
    });

    it('beats dictionary-less compression on near-identical data', () => {
        expect(encodeDcz(data, dictionary).length).toBeLessThan(encodeDcz(data, Buffer.alloc(0)).length);
    });

    it('names variants so that the original extension stays last', () => {
        expect(dczVariantName('client.BFvOi2Pq.js', 'DvIJ_qnm')).toBe('client.BFvOi2Pq.js.DvIJ_qnm.dcz.js');
    });
});

const variants = fs.existsSync(ASTRO_DIR) ? fs.readdirSync(ASTRO_DIR).filter((name) => VARIANT_RE.test(name)) : [];

describe.skipIf(variants.length === 0)('generated dcz variants', () => {
    it.for(variants)('%s decodes back to its asset', (variant) => {
        const { target, dictHash } = variant.match(VARIANT_RE)!.groups!;
        const dictionary = findDictionary(dictHash, parseAssetName(target)!.ext);

        expect(dictionary, `dictionary ${dictHash} for ${variant}`).not.toBeNull();
        expect(decodeDcz(fs.readFileSync(path.join(ASTRO_DIR, variant)), dictionary!)).toEqual(
            fs.readFileSync(path.join(ASTRO_DIR, target)),
        );
    });
});
