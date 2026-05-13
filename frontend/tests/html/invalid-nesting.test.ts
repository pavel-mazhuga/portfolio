import { readFileSync } from 'fs';
import { JSDOM } from 'jsdom';
import { describe, expect, test } from 'vitest';
import { getElementXPath, getHtmlDir, getHtmlFiles } from './utils';

const htmlFiles = getHtmlFiles(getHtmlDir());

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

const checkInvalidNesting = (document: Document): string[] => {
    const violations: string[] = [];

    for (const rule of INVALID_NESTING_RULES) {
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

    // Специальная проверка для ссылок внутри ссылок (исключая object)
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

    return violations;
};

describe('Invalid HTML Nesting', () => {
    test.each(htmlFiles)('$relativePath should not have invalid nesting', ({ path }) => {
        const html = readFileSync(path, 'utf-8');
        const dom = new JSDOM(html);
        const document = dom.window.document;

        const violations = checkInvalidNesting(document);

        expect(violations.length).toBe(0);

        if (violations.length > 0) {
            throw new Error(`Найдены невалидные вложенности:\n${violations.join('\n\n')}`);
        }
    });
});
