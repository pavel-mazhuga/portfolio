import { readFileSync } from 'fs';
import { JSDOM } from 'jsdom';
import { describe, expect, test } from 'vitest';
import { getElementXPath, getHtmlDir, getHtmlFiles } from './utils';

const htmlFiles = getHtmlFiles(getHtmlDir());

const checkObjectNesting = (document: Document): string[] => {
    const violations: string[] = [];

    // Проверяем, что ссылки внутри ссылок обернуты в object
    const linkInLinkWithoutObjectElements = document.querySelectorAll('a a:not(object a)');
    if (linkInLinkWithoutObjectElements.length > 0) {
        const details = Array.from(linkInLinkWithoutObjectElements)
            .slice(0, 5)
            .map((element) => {
                const text = element.textContent || '';
                const href = element.getAttribute('href') || '';
                const parentHref = element.parentElement?.getAttribute('href') || '';
                const trimmedText = text.trim().substring(0, 100);
                const html = element.outerHTML;
                const xpath = getElementXPath(element);
                return `  - <a href="${parentHref}"> > <a href="${href}">: "${trimmedText}${text.length > 100 ? '...' : ''}"\n    HTML: ${html}\n    XPath: ${xpath}`;
            });
        violations.push(
            `Ссылка внутри ссылки без object: найдено ${linkInLinkWithoutObjectElements.length} элементов\n${details.join('\n\n')}`,
        );
    }

    // Проверяем, что кнопки внутри ссылок обернуты в object
    const buttonInLinkWithoutObjectElements = document.querySelectorAll('a button:not(object button)');
    if (buttonInLinkWithoutObjectElements.length > 0) {
        const details = Array.from(buttonInLinkWithoutObjectElements)
            .slice(0, 5)
            .map((element) => {
                const text = element.textContent || '';
                const type = element.getAttribute('type') || '';
                const parentHref = element.parentElement?.getAttribute('href') || '';
                const trimmedText = text.trim().substring(0, 100);
                const html = element.outerHTML;
                const xpath = getElementXPath(element);
                return `  - <a href="${parentHref}"> > <button type="${type}">: "${trimmedText}${text.length > 100 ? '...' : ''}"\n    HTML: ${html}\n    XPath: ${xpath}`;
            });
        violations.push(
            `Кнопка внутри ссылки без object: найдено ${buttonInLinkWithoutObjectElements.length} элементов\n${details.join('\n\n')}`,
        );
    }

    // Проверяем, что другие интерактивные элементы внутри ссылок обернуты в object
    const interactiveInLinkWithoutObjectElements = document.querySelectorAll(
        'a input:not(object input), a select:not(object select), a textarea:not(object textarea)',
    );
    if (interactiveInLinkWithoutObjectElements.length > 0) {
        const details = Array.from(interactiveInLinkWithoutObjectElements)
            .slice(0, 5)
            .map((element) => {
                const tagName = element.tagName.toLowerCase();
                const type = element.getAttribute('type') || '';
                const name = element.getAttribute('name') || '';
                const parentHref = element.parentElement?.getAttribute('href') || '';
                const html = element.outerHTML;
                const xpath = getElementXPath(element);
                return `  - <a href="${parentHref}"> > <${tagName} type="${type}" name="${name}">\n    HTML: ${html}\n    XPath: ${xpath}`;
            });
        violations.push(
            `Интерактивные элементы внутри ссылки без object: найдено ${interactiveInLinkWithoutObjectElements.length} элементов\n${details.join('\n\n')}`,
        );
    }

    // Проверяем правильность использования object
    const objectWithLink = document.querySelectorAll('object a').length;
    if (objectWithLink > 0) {
        // Проверяем, что у object есть data атрибут
        const objectWithoutData = document.querySelectorAll('object:not([data]) a').length;
        if (objectWithoutData > 0) {
            violations.push(`Object с ссылкой без data атрибута: найдено ${objectWithoutData} элементов`);
        }
    }

    return violations;
};

describe('Object Nesting Validation', () => {
    test.each(htmlFiles)('$relativePath should not have object nesting violations', ({ path }) => {
        const html = readFileSync(path, 'utf-8');
        const dom = new JSDOM(html);
        const document = dom.window.document;

        const violations = checkObjectNesting(document);

        expect(violations.length).toBe(0);

        if (violations.length > 0) {
            throw new Error(`Найдены нарушения вложенности через object:\n${violations.join('\n\n')}`);
        }
    });
});
