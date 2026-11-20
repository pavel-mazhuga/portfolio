import { describe, expect, test } from 'vitest';
import { fillLensMap, profileTable } from './lens';

describe('liquid glass displacement map', () => {
    test('bend is 1 at the rim and 0 inside the bevel', () => {
        const table = profileTable(3, 1.5);

        expect(table[0]).toBeCloseTo(1, 5);
        expect(table[table.length - 1]).toBe(0);
        expect(table[40]).toBeGreaterThan(table[200]);
    });

    test('center is flat and the left rim bends toward it', () => {
        const w = 80;
        const h = 48;
        const pixels = new Uint8ClampedArray(w * h * 4);

        fillLensMap(pixels, w, h, w, h, 16);

        const center = ((h / 2) * w + w / 2) * 4;
        const left = ((h / 2) * w + 1) * 4;

        expect(pixels[center + 3]).toBe(255);
        expect(pixels[center]).toBe(128);
        expect(pixels[center + 1]).toBe(128);
        expect(pixels[left]).toBeGreaterThan(128);
        expect(pixels[left + 3]).toBeGreaterThan(0);
    });
});
