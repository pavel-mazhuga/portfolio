import { type Page } from '@playwright/test';
import { testAllPages } from '../utils';

interface MetaTag {
    name?: string;
    property?: string;
    content: string;
}

interface PageMetaData {
    title: string;
    description: string;
    ogTitle: string;
    ogDescription: string;
    ogImage: string;
    ogType: string;
    ogLocale: string;
    twitterCard: string;
    twitterTitle: string;
    twitterDescription: string;
    twitterImage: string;
    robots?: string;
    canonical?: string;
}

const getMetaTags = async (page: Page): Promise<MetaTag[]> => {
    return await page.evaluate(() => {
        const metaTags: MetaTag[] = [];
        const metaElements = document.querySelectorAll('meta');

        metaElements.forEach((meta) => {
            const name = meta.getAttribute('name') || undefined;
            const property = meta.getAttribute('property') || undefined;
            const content = meta.getAttribute('content') || '';

            if (name || property) {
                metaTags.push({ name, property, content });
            }
        });

        return metaTags;
    });
};

const getPageTitle = async (page: Page): Promise<string> => {
    return await page.title();
};

const extractMetaData = (metaTags: MetaTag[], pageTitle: string): PageMetaData => {
    const findMeta = (name?: string, property?: string): string => {
        const tag = metaTags.find((tag) => (name && tag.name === name) || (property && tag.property === property));
        return tag?.content || '';
    };

    return {
        title: pageTitle,
        description: findMeta('description'),
        ogTitle: findMeta(undefined, 'og:title'),
        ogDescription: findMeta(undefined, 'og:description'),
        ogImage: findMeta(undefined, 'og:image'),
        ogType: findMeta(undefined, 'og:type'),
        ogLocale: findMeta(undefined, 'og:locale'),
        twitterCard: findMeta('twitter:card'),
        twitterTitle: findMeta('twitter:title'),
        twitterDescription: findMeta('twitter:description'),
        twitterImage: findMeta('twitter:image'),
        robots: findMeta('robots'),
        canonical: findMeta('canonical'),
    };
};

const validateMetaTag = (value: string, tagName: string, pageUrl: string): string[] => {
    const warnings: string[] = [];

    if (!value.trim()) {
        warnings.push(`⚠️ Метатег "${tagName}" на странице ${pageUrl} пустой`);
        return warnings;
    }

    // Для некоторых метатегов минимальная длина может быть меньше
    const minLength = getMinLengthForTag(tagName);

    if (value.trim().length < minLength) {
        warnings.push(
            `⚠️ Метатег "${tagName}" на странице ${pageUrl} слишком короткий (${value.trim().length}/${minLength} символов)`,
        );
    }

    return warnings;
};

const getMinLengthForTag = (tagName: string): number => {
    // Специальные случаи для коротких метатегов
    const shortTags = ['og:type', 'twitter:card', 'og:locale'];
    return shortTags.includes(tagName) ? 2 : 10;
};

testAllPages('Meta Tags', async (page, url) => {
    const metaTags = await getMetaTags(page);
    const pageTitle = await getPageTitle(page);
    const metaData = extractMetaData(metaTags, pageTitle);
    const allWarnings: string[] = [];

    // Проверяем обязательные метатеги
    // Title
    const titleWarnings = validateMetaTag(metaData.title, 'title', url);
    allWarnings.push(...titleWarnings);

    // Description
    const descWarnings = validateMetaTag(metaData.description, 'description', url);
    allWarnings.push(...descWarnings);

    // Проверяем, что description не слишком длинный (для SEO)
    if (metaData.description.length > 160) {
        allWarnings.push(
            `⚠️ Description на странице ${url} слишком длинный (${metaData.description.length}/160 символов) для SEO`,
        );
    }

    // Проверяем Open Graph метатеги
    const ogTitleWarnings = validateMetaTag(metaData.ogTitle, 'og:title', url);
    allWarnings.push(...ogTitleWarnings);

    const ogDescWarnings = validateMetaTag(metaData.ogDescription, 'og:description', url);
    allWarnings.push(...ogDescWarnings);

    const ogImageWarnings = validateMetaTag(metaData.ogImage, 'og:image', url);
    allWarnings.push(...ogImageWarnings);

    const ogTypeWarnings = validateMetaTag(metaData.ogType, 'og:type', url);
    allWarnings.push(...ogTypeWarnings);

    const ogLocaleWarnings = validateMetaTag(metaData.ogLocale, 'og:locale', url);
    allWarnings.push(...ogLocaleWarnings);

    // Проверяем Twitter Card метатеги
    const twCardWarnings = validateMetaTag(metaData.twitterCard, 'twitter:card', url);
    allWarnings.push(...twCardWarnings);

    const twTitleWarnings = validateMetaTag(metaData.twitterTitle, 'twitter:title', url);
    allWarnings.push(...twTitleWarnings);

    const twDescWarnings = validateMetaTag(metaData.twitterDescription, 'twitter:description', url);
    allWarnings.push(...twDescWarnings);

    const twImageWarnings = validateMetaTag(metaData.twitterImage, 'twitter:image', url);
    allWarnings.push(...twImageWarnings);

    // Проверяем дополнительные метатеги
    if (metaData.robots) {
        const robotsWarnings = validateMetaTag(metaData.robots, 'robots', url);
        allWarnings.push(...robotsWarnings);
    }

    if (metaData.canonical) {
        const canonicalWarnings = validateMetaTag(metaData.canonical, 'canonical', url);
        allWarnings.push(...canonicalWarnings);
    }

    // Выводим warnings, если есть
    if (allWarnings.length > 0) {
        console.log(`\n⚠️ Warnings для ${url}:`);
        allWarnings.forEach((warning) => console.log(warning));
    } else {
        console.log(`\n✅ Метатеги для ${url} в порядке`);
    }

    // Логируем информацию о метатегах для отладки
    console.log(`\nМетатеги для ${url}:`);
    console.log(`Title: ${metaData.title}`);
    console.log(`Description: ${metaData.description} (${metaData.description.length} символов)`);
    console.log(`OG Title: ${metaData.ogTitle}`);
    console.log(`OG Description: ${metaData.ogDescription}`);
    console.log(`OG Image: ${metaData.ogImage}`);
    console.log(`Twitter Title: ${metaData.twitterTitle}`);
    console.log(`Twitter Description: ${metaData.twitterDescription}`);
    console.log(`Twitter Image: ${metaData.twitterImage}`);

    if (metaData.robots) {
        console.log(`Robots: ${metaData.robots}`);
    }
    if (metaData.canonical) {
        console.log(`Canonical: ${metaData.canonical}`);
    }
});
