import { test, expect, chromium, Browser } from '@playwright/test';

const STORYBOOK_BASE_URL = 'http://localhost:6006';

let browser: Browser;
let featureStoryIds: string[] = [];

test.beforeAll(async () => {
    browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(STORYBOOK_BASE_URL);
    await page.waitForSelector('#storybook-explorer-tree');

    featureStoryIds = await page.evaluate(() =>
        Array.from(
            document.querySelectorAll<HTMLElement>('a[data-nodetype="story"]'),
        )
            .map((link) => link.dataset.itemId || '')
            .filter((id) => id !== '' && id.includes('-features-')),
    );
});

test.afterAll(async () => {
    await browser.close();
});

test.describe('Storybook screenshot tests', () => {
    test('Stories match its base screenshots', async ({ page }) => {
        for (const storyId of featureStoryIds) {
            await page.goto(
                `${STORYBOOK_BASE_URL}/iframe.html?id=${storyId}&viewMode=story`,
            );
            await expect(page).toHaveScreenshot({
                maxDiffPixelRatio: 0.01,
            });
        }
    });
});
