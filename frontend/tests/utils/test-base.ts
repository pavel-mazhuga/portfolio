import { type Page, test as base } from '@playwright/test';
import { pages } from '../../playwright.config.common';

// Типы для расширенных fixtures
type TestFixtures = {
    fastPage: Page;
};

// Базовый тест с оптимизированной страницей
export const test = base.extend<TestFixtures>({
    fastPage: async ({ page }, use) => {
        // Оптимизируем страницу для быстрой работы
        await page.setViewportSize({ width: 1280, height: 720 });
        await page.addInitScript(() => {
            // Отключаем анимации для ускорения
            const style = document.createElement('style');
            style.textContent = `
                *, *::before, *::after {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                }
            `;
            document.head.appendChild(style);
        });
        await use(page);
    },
});

export { expect } from '@playwright/test';

// Функция для запуска тестов на всех страницах с оптимизацией
export const testAllPages = (testName: string, testFunction: (page: Page, url: string) => Promise<void>) => {
    test.describe(testName, () => {
        pages.forEach((url) => {
            test(url, async ({ fastPage, baseURL }) => {
                // Быстрая навигация с минимальным ожиданием
                await fastPage.goto(baseURL + url, {
                    waitUntil: 'domcontentloaded',
                    timeout: 8000,
                });
                await testFunction(fastPage, url);
            });
        });
    });
};

// Функция для быстрого тестирования одной страницы
export const testSinglePage = (
    testName: string,
    url: string,
    testFunction: (page: Page, url: string) => Promise<void>,
) => {
    test(testName, async ({ fastPage, baseURL }) => {
        await fastPage.goto(baseURL + url, {
            waitUntil: 'domcontentloaded',
            timeout: 8000,
        });
        await testFunction(fastPage, url);
    });
};
