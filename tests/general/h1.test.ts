import { test, expect } from '@playwright/test';
import { pages } from '../../playwright.config.common';

test.describe('h1', () => {
    pages.forEach((url) => {
        test(url, async ({ page }) => {
            await page.goto(url).catch(() => {
                throw new Error(`Error reaching ${url}`);
            });
            const h1 = page.locator('h1');
            const count = await h1.count();
            await expect(count).toEqual(1);
        });
    });
});
