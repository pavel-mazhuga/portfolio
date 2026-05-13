import { readFileSync } from 'fs';
import validator from 'html-validator';
import { describe, expect, test } from 'vitest';
import { getHtmlDir, getHtmlFiles } from './utils';

const htmlFiles = getHtmlFiles(getHtmlDir());

describe('Valid HTML', () => {
    test.each(htmlFiles)('$relativePath should have valid HTML', async ({ path }) => {
        const html = readFileSync(path, 'utf-8');
        const result = (await validator({
            data: html,
            validator: 'WHATWG',
            format: 'text',
            ignore: [
                'CSS: Parse Error.',
                'Error: Element "style" not allowed as child of element "div" in this context. (Suppressing further errors from this subtree.)',
            ],
        })) as any;

        const { errors } = result;

        if (errors.length > 0) {
            throw new Error(`HTML validation errors:\n${errors.join('\n')}`);
        }

        expect(errors.length).toEqual(0);
    });
});
