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

// Более сложные правила вложенности
const ADVANCED_NESTING_RULES = [
    // Интерактивные элементы внутри других интерактивных
    { parent: 'button', child: 'a', description: 'ссылка внутри кнопки' },
    { parent: 'input', child: 'button', description: 'кнопка внутри input' },
    { parent: 'button', child: 'input', description: 'input внутри кнопки' },

    // Семантические нарушения
    { parent: 'p', child: 'div', description: 'div внутри p' },
    { parent: 'p', child: 'section', description: 'section внутри p' },
    { parent: 'p', child: 'article', description: 'article внутри p' },
    { parent: 'p', child: 'aside', description: 'aside внутри p' },
    { parent: 'p', child: 'nav', description: 'nav внутри p' },
    { parent: 'p', child: 'header', description: 'header внутри p' },
    { parent: 'p', child: 'footer', description: 'footer внутри p' },
    { parent: 'p', child: 'main', description: 'main внутри p' },

    // Таблицы
    { parent: 'tr', child: 'table', description: 'table внутри tr' },
    { parent: 'td', child: 'tr', description: 'tr внутри td' },
    { parent: 'th', child: 'tr', description: 'tr внутри th' },

    // Списки
    { parent: 'li', child: 'ul', description: 'ul внутри li' },
    { parent: 'li', child: 'ol', description: 'ol внутри li' },
    { parent: 'li', child: 'dl', description: 'dl внутри li' },
];

testAllPages('Advanced HTML Nesting Validation', async (page) => {
    const violations: string[] = [];

    for (const rule of ADVANCED_NESTING_RULES) {
        const selector = `${rule.parent} ${rule.child}`;
        const elements = await page.locator(selector);
        const count = await elements.count();

        if (count > 0) {
            const details = [];
            for (let i = 0; i < Math.min(count, 5); i++) {
                const element = elements.nth(i);
                const text = (await element.textContent()) || '';
                const tagName = await element.evaluate((el) => el.tagName.toLowerCase());
                const parentTagName = await element.evaluate(
                    (el) => el.parentElement?.tagName.toLowerCase() || 'unknown',
                );
                const trimmedText = text.trim().substring(0, 100);
                const html = await element.evaluate((el: Element) => el.outerHTML);
                const xpath = await getElementXPath(element);
                details.push(
                    `  - ${parentTagName} > ${tagName}: "${trimmedText}${text.length > 100 ? '...' : ''}"\n    HTML: ${html}\n    XPath: ${xpath}`,
                );
            }
            violations.push(`${rule.description}: найдено ${count} элементов\n${details.join('\n\n')}`);
        }
    }

    // Проверка на вложенные формы (более детальная)
    const nestedFormsElements = await page.locator('form form');
    const nestedFormsCount = await nestedFormsElements.count();
    if (nestedFormsCount > 0) {
        const details = [];
        for (let i = 0; i < Math.min(nestedFormsCount, 5); i++) {
            const element = nestedFormsElements.nth(i);
            const action = (await element.getAttribute('action')) || '';
            const parentAction = await element.evaluate((el) => el.parentElement?.getAttribute('action') || '');
            const html = await element.evaluate((el: Element) => el.outerHTML);
            const xpath = await getElementXPath(element);
            details.push(
                `  - <form action="${parentAction}"> > <form action="${action}">\n    HTML: ${html}\n    XPath: ${xpath}`,
            );
        }
        violations.push(`Вложенные формы: найдено ${nestedFormsCount} элементов\n${details.join('\n\n')}`);
    }

    // Проверка на кнопки внутри кнопок (включая разные типы)
    const buttonInButtonElements = await page.locator('button button');
    const buttonInButtonCount = await buttonInButtonElements.count();
    if (buttonInButtonCount > 0) {
        const details = [];
        for (let i = 0; i < Math.min(buttonInButtonCount, 5); i++) {
            const element = buttonInButtonElements.nth(i);
            const text = (await element.textContent()) || '';
            const type = (await element.getAttribute('type')) || '';
            const parentType = await element.evaluate((el) => el.parentElement?.getAttribute('type') || '');
            const trimmedText = text.trim().substring(0, 100);
            const html = await element.evaluate((el: Element) => el.outerHTML);
            const xpath = await getElementXPath(element);
            details.push(
                `  - <button type="${parentType}"> > <button type="${type}">: "${trimmedText}${text.length > 100 ? '...' : ''}"\n    HTML: ${html}\n    XPath: ${xpath}`,
            );
        }
        violations.push(`Кнопка внутри кнопки: найдено ${buttonInButtonCount} элементов\n${details.join('\n\n')}`);
    }

    // Проверка на ссылки внутри ссылок (исключая object)
    const linkInLinkElements = await page.locator('a a:not(object a)');
    const linkInLinkCount = await linkInLinkElements.count();
    if (linkInLinkCount > 0) {
        const details = [];
        for (let i = 0; i < Math.min(linkInLinkCount, 5); i++) {
            const element = linkInLinkElements.nth(i);
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
            `Ссылка внутри ссылки (без object): найдено ${linkInLinkCount} элементов\n${details.join('\n\n')}`,
        );
    }

    // Проверка на кнопки внутри ссылок (исключая object)
    const buttonInLinkElements = await page.locator('a button:not(object button)');
    const buttonInLinkCount = await buttonInLinkElements.count();
    if (buttonInLinkCount > 0) {
        const details = [];
        for (let i = 0; i < Math.min(buttonInLinkCount, 5); i++) {
            const element = buttonInLinkElements.nth(i);
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
            `Кнопка внутри ссылки (без object): найдено ${buttonInLinkCount} элементов\n${details.join('\n\n')}`,
        );
    }

    expect(violations.length, `Найдены невалидные вложенности:\n${violations.join('\n')}`).toEqual(0);
});
