import { test, Page, expect } from '@playwright/test';
import fs from 'fs';
import { ElementContext, RunOptions, AxeResults } from 'axe-core';
import { pages } from '../../playwright.config.common';

const injectAxe = async (page: Page): Promise<void> => {
    const axe: string = fs.readFileSync(
        require.resolve('axe-core/axe.min.js'),
        'utf8',
    );
    await page.evaluate((axe: string) => window.eval(axe), axe);
};

const getAxeResults = async (
    page: Page,
    context?: ElementContext,
    options?: RunOptions,
): Promise<AxeResults> => {
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
        'image-alt': { enabled: false },
    },
};

test.describe('Accessibility', () => {
    pages.forEach((url) => {
        test(url, async ({ page }) => {
            await page.goto(url).catch(() => {
                throw new Error(`Error reaching ${url}`);
            });
            await injectAxe(page);
            const violations = (
                await (
                    await getAxeResults(page, undefined, options)
                ).violations
            ).filter((violation) =>
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
                                `Description: ${violation.description}`,
                                `Impact: ${violation.impact}`,
                                `Nodes: ${violation.nodes.length}`,
                            ].join('\n'),
                        )
                        .join('\n\n'),
                ].join('\n\n'),
            ).toEqual(0);
        });
    });
});
