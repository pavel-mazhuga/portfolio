import { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

export const getHtmlDir = (): string => {
    const astroBuildPath = join(process.cwd(), 'build');

    if (existsSync(astroBuildPath)) {
        return astroBuildPath;
    } else {
        throw new Error('Build directory not found. Please run "pnpm build" first.');
    }
};

export const getHtmlFiles = (dir: string): Array<{ path: string; relativePath: string }> => {
    const files: Array<{ path: string; relativePath: string }> = [];

    const processFiles = (currentDir: string): void => {
        const items = readdirSync(currentDir);

        for (const item of items) {
            const filePath = join(currentDir, item);
            const stat = statSync(filePath);

            if (stat.isDirectory()) {
                processFiles(filePath);
            } else if (item.endsWith('.html') && !item.includes('.nft.')) {
                const relativePath = filePath
                    .replace(dir, '')
                    .replace('.html', '')
                    .replace(/\/index$/, '/');
                files.push({ path: filePath, relativePath: relativePath || '/' });
            }
        }
    };

    processFiles(dir);
    return files;
};

export const getElementXPath = (element: Element): string => {
    if (element.id) return `//*[@id="${element.id}"]`;
    if (element === document.body) return '/html/body';
    if (element.parentNode) {
        const parent = element.parentNode as Element;
        const siblings = Array.from(parent.children).filter((child) => child.tagName === element.tagName);
        const index = siblings.indexOf(element) + 1;
        return `${getElementXPath(parent)}/${element.tagName.toLowerCase()}[${index}]`;
    }
    return '';
};

export const createViolationDetails = (element: Element, description: string): string => {
    const text = element.textContent || '';
    const trimmedText = text.trim().substring(0, 100);
    const html = element.outerHTML;
    const xpath = getElementXPath(element);

    return `  - ${description}: "${trimmedText}${text.length > 100 ? '...' : ''}"\n    HTML: ${html}\n    XPath: ${xpath}`;
};
