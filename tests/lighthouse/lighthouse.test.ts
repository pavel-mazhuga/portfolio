import playwright from 'playwright';
import { test, expect } from '@playwright/test';
import lighthouse from 'lighthouse';
import { pages } from '../../playwright.config.common';

const describe = process.env.CI ? test.describe.skip : test.describe;
const minScore = 50;

describe('Lighthouse Score', () => {
    pages.forEach((url) => {
        test(url, async ({ baseURL }) => {
            const browser = await playwright['chromium'].launch({
                args: ['--remote-debugging-port=9222', '--no-sandbox', '--headless'],
            });
            const runnerResult = await lighthouse(baseURL + url, {
                onlyCategories: ['performance'],
                port: 9222,
            });
            const score = Math.round(runnerResult.lhr.categories.performance.score * 100);

            console.log(`${runnerResult.lhr.finalUrl} => Performance score: ${score}`);
            expect(
                score,
                `Performance score: ${score}. Least expected performance score: ${minScore}.`,
            ).toBeGreaterThanOrEqual(minScore);

            await browser.close();
        });
    });
});
