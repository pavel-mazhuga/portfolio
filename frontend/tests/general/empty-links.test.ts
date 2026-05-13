import { expect, testAllPages } from '../utils';

// Вспомогательная функция для получения XPath элемента
const getElementXPath = async (element: any): Promise<string> => {
    return await element.evaluate((el: Element): string => {
        const getXPath = (element: Element): string => {
            if (element.id) return `//*[@id="${element.id}"]`;
            if (element === document.body) return '/html/body';
            if (element.parentNode) {
                const parent = element.parentNode as Element;
                const siblings = Array.from(parent.children).filter((child) => child.tagName === element.tagName);
                const index = siblings.indexOf(element) + 1;
                return `${getXPath(parent)}/${element.tagName.toLowerCase()}[${index}]`;
            }
            return '';
        };
        return getXPath(el);
    });
};

// Вспомогательная функция для создания детального отчета
const createViolationDetails = async (element: any, description: string): Promise<string> => {
    const text = (await element.textContent()) || '';
    const trimmedText = text.trim().substring(0, 100);
    const html = await element.evaluate((el: Element) => el.outerHTML);
    const xpath = await getElementXPath(element);

    return `  - ${description}: "${trimmedText}${text.length > 100 ? '...' : ''}"\n    HTML: ${html}\n    XPath: ${xpath}`;
};

testAllPages('Empty Links Validation', async (page) => {
    const violations: string[] = [];

    // Проверяем ссылки с пустыми href
    const emptyHrefElements = await page.locator('a[href=""]');
    const emptyHrefCount = await emptyHrefElements.count();
    if (emptyHrefCount > 0) {
        const details = [];
        for (let i = 0; i < Math.min(emptyHrefCount, 5); i++) {
            const element = emptyHrefElements.nth(i);
            details.push(await createViolationDetails(element, '<a href="">'));
        }
        violations.push(`Пустые href: найдено ${emptyHrefCount} элементов\n${details.join('\n\n')}`);
    }

    // Проверяем ссылки с href="#"
    const hashHrefElements = await page.locator('a[href="#"]');
    const hashHrefCount = await hashHrefElements.count();
    if (hashHrefCount > 0) {
        const details = [];
        for (let i = 0; i < Math.min(hashHrefCount, 5); i++) {
            const element = hashHrefElements.nth(i);
            details.push(await createViolationDetails(element, '<a href="#">'));
        }
        violations.push(`Ссылки с href="#": найдено ${hashHrefCount} элементов\n${details.join('\n\n')}`);
    }

    // Проверяем ссылки с href="javascript:void(0)"
    const jsVoidElements = await page.locator('a[href="javascript:void(0)"]');
    const jsVoidCount = await jsVoidElements.count();
    if (jsVoidCount > 0) {
        const details = [];
        for (let i = 0; i < Math.min(jsVoidCount, 5); i++) {
            const element = jsVoidElements.nth(i);
            details.push(await createViolationDetails(element, '<a href="javascript:void(0)">'));
        }
        violations.push(`Ссылки с javascript:void(0): найдено ${jsVoidCount} элементов\n${details.join('\n\n')}`);
    }

    // Проверяем ссылки без href атрибута
    const noHrefElements = await page.locator('a:not([href])');
    const noHrefCount = await noHrefElements.count();
    if (noHrefCount > 0) {
        const details = [];
        for (let i = 0; i < Math.min(noHrefCount, 5); i++) {
            const element = noHrefElements.nth(i);
            details.push(await createViolationDetails(element, '<a>'));
        }
        violations.push(`Ссылки без href: найдено ${noHrefCount} элементов\n${details.join('\n\n')}`);
    }

    // Проверяем ссылки с пустым текстом (исключая те, у которых есть aria-label)
    const emptyTextElements = await page.locator('a').filter({ hasText: /^\s*$/ });
    const emptyTextCount = await emptyTextElements.count();
    if (emptyTextCount > 0) {
        const details = [];
        let validEmptyTextCount = 0;

        for (let i = 0; i < emptyTextCount; i++) {
            const element = emptyTextElements.nth(i);
            const ariaLabel = await element.getAttribute('aria-label');

            // Пропускаем элементы с непустым aria-label
            if (ariaLabel && ariaLabel.trim() !== '') {
                validEmptyTextCount++;
                continue;
            }

            if (details.length < 5) {
                const href = (await element.getAttribute('href')) || '';
                const html = await element.evaluate((el: Element) => el.outerHTML);
                const xpath = await getElementXPath(element);
                details.push(`  - <a href="${href}">: пустой текст\n    HTML: ${html}\n    XPath: ${xpath}`);
            }
        }

        const invalidEmptyTextCount = emptyTextCount - validEmptyTextCount;
        if (invalidEmptyTextCount > 0) {
            violations.push(
                `Ссылки с пустым текстом (без aria-label): найдено ${invalidEmptyTextCount} элементов\n${details.join('\n\n')}`,
            );
        }
    }

    expect(violations.length, `Найдены пустые ссылки:\n${violations.join('\n\n')}`).toEqual(0);
});
