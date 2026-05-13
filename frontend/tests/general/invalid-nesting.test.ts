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

// Запрещенные вложенности элементов
const INVALID_NESTING_RULES = [
    { parent: 'button', child: 'button', description: 'button внутри button' },
    { parent: 'form', child: 'form', description: 'form внутри form' },
    { parent: 'input', child: 'input', description: 'input внутри input' },
    { parent: 'label', child: 'label', description: 'label внутри label' },
    { parent: 'select', child: 'select', description: 'select внутри select' },
    { parent: 'textarea', child: 'textarea', description: 'textarea внутри textarea' },
    { parent: 'fieldset', child: 'fieldset', description: 'fieldset внутри fieldset' },
    { parent: 'legend', child: 'legend', description: 'legend внутри legend' },
    { parent: 'details', child: 'details', description: 'details внутри details' },
    { parent: 'summary', child: 'summary', description: 'summary внутри summary' },
    { parent: 'dialog', child: 'dialog', description: 'dialog внутри dialog' },
    { parent: 'menu', child: 'menu', description: 'menu внутри menu' },
    { parent: 'menuitem', child: 'menuitem', description: 'menuitem внутри menuitem' },
];

testAllPages('Invalid HTML Nesting', async (page) => {
    const violations: string[] = [];

    for (const rule of INVALID_NESTING_RULES) {
        const selector = `${rule.parent} ${rule.child}`;
        const elements = await page.locator(selector);
        const count = await elements.count();

        if (count > 0) {
            const details = [];
            for (let i = 0; i < Math.min(count, 5); i++) {
                // Показываем максимум 5 примеров
                const element = elements.nth(i);
                const text = (await element.textContent()) || '';
                const tagName = await element.evaluate((el) => el.tagName.toLowerCase());
                const parentTagName = await element.evaluate(
                    (el) => el.parentElement?.tagName.toLowerCase() || 'unknown',
                );
                const trimmedText = text.trim().substring(0, 100); // Ограничиваем длину текста
                const html = await element.evaluate((el: Element) => el.outerHTML);
                const xpath = await getElementXPath(element);
                details.push(
                    `  - ${parentTagName} > ${tagName}: "${trimmedText}${text.length > 100 ? '...' : ''}"\n    HTML: ${html}\n    XPath: ${xpath}`,
                );
            }
            violations.push(`${rule.description}: найдено ${count} элементов\n${details.join('\n\n')}`);
        }
    }

    // Специальная проверка для ссылок внутри ссылок (исключая object)
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

    expect(violations.length, `Найдены невалидные вложенности:\n${violations.join('\n')}`).toEqual(0);
});
