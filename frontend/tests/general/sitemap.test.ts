import { type Page } from '@playwright/test';
import { expect, test } from '../utils';

const extractSitemapLinks = async (page: Page): Promise<string[]> => {
    return await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href]'));
        return links
            .map((link) => link.getAttribute('href'))
            .filter((href): href is string => href !== null && href !== '')
            .filter((href) => href.startsWith('http') || href.startsWith('/'));
    });
};

const checkLinkStatus = async (
    page: Page,
    linkUrl: string,
): Promise<{ url: string; status: number; error?: string }> => {
    try {
        console.log(`Проверяю ссылку: ${linkUrl}`);
        const response = await page.request.get(linkUrl, {
            timeout: 30000, // 30 секунд
            ignoreHTTPSErrors: true,
        });
        const status = response.status();
        console.log(`Ссылка ${linkUrl} вернула статус: ${status}`);
        return { url: linkUrl, status };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.log(`Ошибка для ссылки ${linkUrl}: ${errorMessage}`);
        return { url: linkUrl, status: 0, error: errorMessage };
    }
};

test('HTML Sitemap Links Status', async ({ fastPage, baseURL }) => {
    test.setTimeout(0); // Убираем таймаут для этого теста
    const url = '/sitemap/';
    // Убираем таймаут для этого теста
    fastPage.setDefaultTimeout(0);

    await fastPage.goto(baseURL + url, {
        waitUntil: 'domcontentloaded',
        timeout: 8000,
    });

    const page = fastPage;
    // Проверяем, что страница существует и загружается
    let response;
    try {
        response = await page.goto(page.url(), { waitUntil: 'domcontentloaded' });
    } catch {
        // HTML-карта сайта не найдена по пути /sitemap/, пропускаем тест
        return;
    }

    if (!response || response.status() === 404) {
        // HTML-карта сайта не найдена по пути /sitemap/, пропускаем тест
        return;
    }

    expect(response.status()).toBe(200);

    // Извлекаем все ссылки из HTML-карты сайта
    const allLinks = await extractSitemapLinks(page);

    // Фильтруем ссылки, оставляя только внутренние
    const baseUrl = page.url().split('/').slice(0, 3).join('/'); // получаем домен из текущего URL
    const sitemapLinks = allLinks.filter((link) => {
        return link.startsWith('/') || link.startsWith(baseUrl);
    });

    if (sitemapLinks.length === 0) {
        throw new Error(`HTML-карта сайта ${url} не содержит ни одной ссылки для проверки`);
    }

    // Проверяем статус каждой ссылки с ограничением параллельности
    const linkStatuses: { url: string; status: number; error?: string }[] = [];
    const BATCH_SIZE = 10; // Максимум 6 запросов одновременно

    for (let i = 0; i < sitemapLinks.length; i += BATCH_SIZE) {
        const batch = sitemapLinks.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(batch.map((linkUrl) => checkLinkStatus(page, linkUrl)));
        linkStatuses.push(...batchResults);

        // Небольшая пауза между батчами
        if (i + BATCH_SIZE < sitemapLinks.length) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
    }

    // Фильтруем ссылки, которые НЕ возвращают 2xx статус
    const non2xxLinks = linkStatuses.filter((link) => {
        const status = link.status;
        return status < 200 || status >= 300;
    });

    if (non2xxLinks.length > 0) {
        const errorDetails = non2xxLinks
            .map((link) => `URL: ${link.url}, Status: ${link.status}${link.error ? `, Error: ${link.error}` : ''}`)
            .join('\n');

        throw new Error(`HTML-карта сайта ${url} содержит ссылки с ошибочными статусами (не 2xx):\n${errorDetails}`);
    }
});
