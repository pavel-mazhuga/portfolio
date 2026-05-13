import { readFileSync } from 'fs';
import { JSDOM } from 'jsdom';
import { describe, expect, test } from 'vitest';
import { getElementXPath, getHtmlDir, getHtmlFiles } from './utils';

const htmlFiles = getHtmlFiles(getHtmlDir());

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

const checkAdvancedNesting = (document: Document): string[] => {
    const violations: string[] = [];

    for (const rule of ADVANCED_NESTING_RULES) {
        const selector = `${rule.parent} ${rule.child}`;
        const elements = document.querySelectorAll(selector);

        if (elements.length > 0) {
            const details = Array.from(elements)
                .slice(0, 5)
                .map((element) => {
                    const text = element.textContent || '';
                    const tagName = element.tagName.toLowerCase();
                    const parentTagName = element.parentElement?.tagName.toLowerCase() || 'unknown';
                    const trimmedText = text.trim().substring(0, 100);
                    const html = element.outerHTML;
                    const xpath = getElementXPath(element);
                    return `  - ${parentTagName} > ${tagName}: "${trimmedText}${text.length > 100 ? '...' : ''}"\n    HTML: ${html}\n    XPath: ${xpath}`;
                });
            violations.push(`${rule.description}: найдено ${elements.length} элементов\n${details.join('\n\n')}`);
        }
    }

    // Проверка на вложенные формы (более детальная)
    const nestedFormsElements = document.querySelectorAll('form form');
    if (nestedFormsElements.length > 0) {
        const details = Array.from(nestedFormsElements)
            .slice(0, 5)
            .map((element) => {
                const action = element.getAttribute('action') || '';
                const parentAction = element.parentElement?.getAttribute('action') || '';
                const html = element.outerHTML;
                const xpath = getElementXPath(element);
                return `  - <form action="${parentAction}"> > <form action="${action}">\n    HTML: ${html}\n    XPath: ${xpath}`;
            });
        violations.push(`Вложенные формы: найдено ${nestedFormsElements.length} элементов\n${details.join('\n\n')}`);
    }

    // Проверка на кнопки внутри кнопок (включая разные типы)
    const buttonInButtonElements = document.querySelectorAll('button button');
    if (buttonInButtonElements.length > 0) {
        const details = Array.from(buttonInButtonElements)
            .slice(0, 5)
            .map((element) => {
                const text = element.textContent || '';
                const type = element.getAttribute('type') || '';
                const parentType = element.parentElement?.getAttribute('type') || '';
                const trimmedText = text.trim().substring(0, 100);
                const html = element.outerHTML;
                const xpath = getElementXPath(element);
                return `  - <button type="${parentType}"> > <button type="${type}">: "${trimmedText}${text.length > 100 ? '...' : ''}"\n    HTML: ${html}\n    XPath: ${xpath}`;
            });
        violations.push(
            `Кнопка внутри кнопки: найдено ${buttonInButtonElements.length} элементов\n${details.join('\n\n')}`,
        );
    }

    // Проверка на ссылки внутри ссылок (исключая object)
    const linkInLinkElements = document.querySelectorAll('a a:not(object a)');
    if (linkInLinkElements.length > 0) {
        const details = Array.from(linkInLinkElements)
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
            `Ссылка внутри ссылки (без object): найдено ${linkInLinkElements.length} элементов\n${details.join('\n\n')}`,
        );
    }

    // Проверка на кнопки внутри ссылок (исключая object)
    const buttonInLinkElements = document.querySelectorAll('a button:not(object button)');
    if (buttonInLinkElements.length > 0) {
        const details = Array.from(buttonInLinkElements)
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
            `Кнопка внутри ссылки (без object): найдено ${buttonInLinkElements.length} элементов\n${details.join('\n\n')}`,
        );
    }

    return violations;
};

describe('Advanced HTML Nesting Validation', () => {
    test.each(htmlFiles)('$relativePath should not have advanced nesting violations', ({ path }) => {
        const html = readFileSync(path, 'utf-8');
        const dom = new JSDOM(html);
        const document = dom.window.document;

        const violations = checkAdvancedNesting(document);

        expect(violations.length).toBe(0);

        if (violations.length > 0) {
            throw new Error(`Найдены невалидные вложенности:\n${violations.join('\n\n')}`);
        }
    });
});
