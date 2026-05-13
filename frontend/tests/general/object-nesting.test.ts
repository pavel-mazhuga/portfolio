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

testAllPages('Object Nesting Validation', async (page) => {
    const violations: string[] = [];

    // Проверяем, что ссылки внутри ссылок обернуты в object
    const linkInLinkWithoutObjectElements = await page.locator('a a:not(object a)');
    const linkInLinkWithoutObjectCount = await linkInLinkWithoutObjectElements.count();
    if (linkInLinkWithoutObjectCount > 0) {
        const details = [];
        for (let i = 0; i < Math.min(linkInLinkWithoutObjectCount, 5); i++) {
            const element = linkInLinkWithoutObjectElements.nth(i);
            const text = (await element.textContent()) || '';
            const href = (await element.getAttribute('href')) || '';
            const parentHref = await element.evaluate((el) => el.parentElement?.getAttribute('href') || '');
            const trimmedText = text.trim().substring(0, 100);
            const html = await element.evaluate((el: Element) => el.outerHTML);
            const xpath = await getElementXPath(element);
            details.push(
                `  - <a href="${parentHref}"> > <a href="${href}">: "${trimmedText}${text.length > 100 ? '...' : ''}"\n    HTML: ${html}\n    XPath: ${xpath}`,
            );
        }
        violations.push(
            `Ссылка внутри ссылки без object: найдено ${linkInLinkWithoutObjectCount} элементов\n${details.join('\n\n')}`,
        );
    }

    // Проверяем, что кнопки внутри ссылок обернуты в object
    const buttonInLinkWithoutObjectElements = await page.locator('a button:not(object button)');
    const buttonInLinkWithoutObjectCount = await buttonInLinkWithoutObjectElements.count();
    if (buttonInLinkWithoutObjectCount > 0) {
        const details = [];
        for (let i = 0; i < Math.min(buttonInLinkWithoutObjectCount, 5); i++) {
            const element = buttonInLinkWithoutObjectElements.nth(i);
            const text = (await element.textContent()) || '';
            const type = (await element.getAttribute('type')) || '';
            const parentHref = await element.evaluate((el) => el.parentElement?.getAttribute('href') || '');
            const trimmedText = text.trim().substring(0, 100);
            const html = await element.evaluate((el: Element) => el.outerHTML);
            const xpath = await getElementXPath(element);
            details.push(
                `  - <a href="${parentHref}"> > <button type="${type}">: "${trimmedText}${text.length > 100 ? '...' : ''}"\n    HTML: ${html}\n    XPath: ${xpath}`,
            );
        }
        violations.push(
            `Кнопка внутри ссылки без object: найдено ${buttonInLinkWithoutObjectCount} элементов\n${details.join('\n\n')}`,
        );
    }

    // Проверяем, что другие интерактивные элементы внутри ссылок обернуты в object
    const interactiveInLinkWithoutObjectElements = await page.locator(
        'a input:not(object input), a select:not(object select), a textarea:not(object textarea)',
    );
    const interactiveInLinkWithoutObjectCount = await interactiveInLinkWithoutObjectElements.count();
    if (interactiveInLinkWithoutObjectCount > 0) {
        const details = [];
        for (let i = 0; i < Math.min(interactiveInLinkWithoutObjectCount, 5); i++) {
            const element = interactiveInLinkWithoutObjectElements.nth(i);
            const tagName = await element.evaluate((el) => el.tagName.toLowerCase());
            const type = (await element.getAttribute('type')) || '';
            const name = (await element.getAttribute('name')) || '';
            const parentHref = await element.evaluate((el) => el.parentElement?.getAttribute('href') || '');
            const html = await element.evaluate((el: Element) => el.outerHTML);
            const xpath = await getElementXPath(element);
            details.push(
                `  - <a href="${parentHref}"> > <${tagName} type="${type}" name="${name}">\n    HTML: ${html}\n    XPath: ${xpath}`,
            );
        }
        violations.push(
            `Интерактивные элементы внутри ссылки без object: найдено ${interactiveInLinkWithoutObjectCount} элементов\n${details.join('\n\n')}`,
        );
    }

    // Проверяем правильность использования object
    const objectWithLink = await page.locator('object a').count();
    if (objectWithLink > 0) {
        // Проверяем, что у object есть data атрибут
        const objectWithoutData = await page.locator('object:not([data]) a').count();
        if (objectWithoutData > 0) {
            violations.push(`Object с ссылкой без data атрибута: найдено ${objectWithoutData} элементов`);
        }
    }

    expect(violations.length, `Найдены нарушения вложенности через object:\n${violations.join('\n')}`).toEqual(0);
});
