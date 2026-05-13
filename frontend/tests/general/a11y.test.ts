import { type Page } from '@playwright/test';
import { AxeResults, type ElementContext, type RunOptions } from 'axe-core';
import fs from 'fs';
import { createRequire } from 'module';
import { expect, testAllPages } from '../utils';

const require = createRequire(import.meta.url);

const injectAxe = async (page: Page): Promise<void> => {
    const axe: string = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
    await page.evaluate((axe: string) => window.eval(axe), axe);
};

const getAxeResults = async (page: Page, context?: ElementContext, options?: RunOptions): Promise<AxeResults> => {
    const result = await page.evaluate(
        // @ts-ignore
        ([context, options]) => {
            return (window as any).axe.run(context || window.document, options);
        },
        [context, options],
    );

    return result;
};

const options: RunOptions = {
    iframes: false,
    rules: {
        'color-contrast': { enabled: false },
        'link-in-text-block': { enabled: false },
        'image-alt': { enabled: false },
        'meta-viewport': { enabled: false },
    },
};

testAllPages('Accessibility', async (page) => {
    await injectAxe(page);
    const violations = (await (await getAxeResults(page, undefined, options)).violations).filter((violation) =>
        ['serious', 'critical'].includes(violation.impact || ''),
    );

    expect(
        violations.length,
        [
            `${violations.length} accessibility violations were detected:`,
            violations
                .map((violation) =>
                    [
                        `ID: ${violation.id}`,
                        `Title: ${violation.help}`,
                        `Description: ${violation.description}`,
                        `Impact: ${violation.impact}`,
                        `Amount: ${violation.nodes.length}`,
                        `Nodes: ${violation.nodes.map(
                            (node) => `
                    \nHTML: ${node.html}
                    \nHint: ${node.failureSummary}
                `,
                        )}`,
                        `Read more: ${violation.helpUrl}`,
                        `Tags: ${violation.tags}`,
                    ].join('\n\n'),
                )
                .join('\n\n'),
        ].join('\n\n'),
    ).toEqual(0);
});
