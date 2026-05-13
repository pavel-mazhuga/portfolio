import { readFileSync } from 'fs';
import { JSDOM } from 'jsdom';
import { describe, expect, test } from 'vitest';
import { getHtmlDir, getHtmlFiles } from './utils';

const htmlFiles = getHtmlFiles(getHtmlDir());

describe('h1 HTML validation', () => {
    test.each(htmlFiles)('$relativePath should have exactly one h1 element', ({ path }) => {
        const html = readFileSync(path, 'utf-8');
        const dom = new JSDOM(html);
        const document = dom.window.document;

        const h1Elements = document.querySelectorAll('h1');
        const h1Count = h1Elements.length;

        expect(h1Count).toBe(1);

        if (h1Count === 1) {
            const h1Text = h1Elements[0].textContent?.trim();
            expect(h1Text).not.toBe('');
        }
    });
});
