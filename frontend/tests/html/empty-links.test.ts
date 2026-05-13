import { readFileSync } from 'fs';
import { JSDOM } from 'jsdom';
import { describe, expect, test } from 'vitest';
import { createViolationDetails, getElementXPath, getHtmlDir, getHtmlFiles } from './utils';

const htmlFiles = getHtmlFiles(getHtmlDir());

const checkEmptyLinks = (document: Document): string[] => {
    const violations: string[] = [];

    // Проверяем ссылки с пустыми href
    const emptyHrefElements = document.querySelectorAll('a[href=""]');
    if (emptyHrefElements.length > 0) {
        const details = Array.from(emptyHrefElements)
            .slice(0, 5)
            .map((element) => createViolationDetails(element, '<a href="">'));
        violations.push(`Пустые href: найдено ${emptyHrefElements.length} элементов\n${details.join('\n\n')}`);
    }

    // Проверяем ссылки с href="#"
    const hashHrefElements = document.querySelectorAll('a[href="#"]');
    if (hashHrefElements.length > 0) {
        const details = Array.from(hashHrefElements)
            .slice(0, 5)
            .map((element) => createViolationDetails(element, '<a href="#">'));
        violations.push(`Ссылки с href="#": найдено ${hashHrefElements.length} элементов\n${details.join('\n\n')}`);
    }

    // Проверяем ссылки с href="javascript:void(0)"
    const jsVoidElements = document.querySelectorAll('a[href="javascript:void(0)"]');
    if (jsVoidElements.length > 0) {
        const details = Array.from(jsVoidElements)
            .slice(0, 5)
            .map((element) => createViolationDetails(element, '<a href="javascript:void(0)">'));
        violations.push(
            `Ссылки с javascript:void(0): найдено ${jsVoidElements.length} элементов\n${details.join('\n\n')}`,
        );
    }

    // Проверяем ссылки без href атрибута
    const noHrefElements = document.querySelectorAll('a:not([href])');
    if (noHrefElements.length > 0) {
        const details = Array.from(noHrefElements)
            .slice(0, 5)
            .map((element) => createViolationDetails(element, '<a>'));
        violations.push(`Ссылки без href: найдено ${noHrefElements.length} элементов\n${details.join('\n\n')}`);
    }

    // Проверяем ссылки с пустым текстом (исключая те, у которых есть aria-label)
    const allLinks = document.querySelectorAll('a');
    const emptyTextElements = Array.from(allLinks).filter((link) => {
        const text = link.textContent?.trim() || '';
        return text === '';
    });

    if (emptyTextElements.length > 0) {
        const details = [];
        let validEmptyTextCount = 0;

        for (const element of emptyTextElements) {
            const ariaLabel = element.getAttribute('aria-label');

            // Пропускаем элементы с непустым aria-label
            if (ariaLabel && ariaLabel.trim() !== '') {
                validEmptyTextCount++;
                continue;
            }

            if (details.length < 5) {
                const href = element.getAttribute('href') || '';
                const html = element.outerHTML;
                const xpath = getElementXPath(element);
                details.push(`  - <a href="${href}">: пустой текст\n    HTML: ${html}\n    XPath: ${xpath}`);
            }
        }

        const invalidEmptyTextCount = emptyTextElements.length - validEmptyTextCount;
        if (invalidEmptyTextCount > 0) {
            violations.push(
                `Ссылки с пустым текстом (без aria-label): найдено ${invalidEmptyTextCount} элементов\n${details.join('\n\n')}`,
            );
        }
    }

    return violations;
};

describe('Empty Links HTML validation', () => {
    test.each(htmlFiles)('$relativePath should not have empty links', ({ path }) => {
        const html = readFileSync(path, 'utf-8');
        const dom = new JSDOM(html);
        const document = dom.window.document;

        const violations = checkEmptyLinks(document);

        if (violations.length > 0) {
            throw new Error(`Найдены пустые ссылки:\n${violations.join('\n\n')}`);
        }
        expect(violations.length).toBe(0);
    });
});
