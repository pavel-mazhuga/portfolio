#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const labRoot = path.join(root, 'src', 'app', 'lab');
const templateDir = path.join(labRoot, 'demo');

const nameKebab = process.argv[2];

if (!nameKebab) {
    console.error('Укажи имя демо: npm run demo <demo-name-kebab-case>');
    process.exit(1);
}

if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(nameKebab)) {
    console.error('Имя должно быть в kebab-case: только строчные буквы, цифры и тире.');
    process.exit(1);
}

const toPascal = (s) =>
    s
        .split('-')
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join('');
const toTitle = (s) =>
    s
        .split('-')
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(' ');

const namePascal = toPascal(nameKebab);
const nameTitle = toTitle(nameKebab);

const targetDir = path.join(labRoot, nameKebab);

if (fs.existsSync(targetDir)) {
    console.error(`Папка уже существует: ${targetDir}`);
    process.exit(1);
}

if (!fs.existsSync(templateDir)) {
    console.error(`Не найден шаблон: ${templateDir}`);
    process.exit(1);
}

fs.mkdirSync(targetDir, { recursive: true });

const readUtf8 = (p) => fs.readFileSync(p, 'utf8');
const writeUtf8 = (p, c) => fs.writeFileSync(p, c, 'utf8');

// Demo.ts
(() => {
    const src = readUtf8(path.join(templateDir, 'Demo.ts')).replace(/\bDemo\b/g, namePascal);
    writeUtf8(path.join(targetDir, 'Demo.ts'), src);
})();

// experience.tsx (всегда импорт и использование Demo)
(() => {
    const src = readUtf8(path.join(templateDir, 'experience.tsx'));
    writeUtf8(path.join(targetDir, 'experience.tsx'), src);
})();

// page.tsx
(() => {
    let src = readUtf8(path.join(templateDir, 'page.tsx'));
    src = src
        .replace(/title:\s*'[^']*'/, `title: '${nameTitle}'`)
        .replace(/description:\s*'[^']*'/, `description: '${nameTitle} using TSL'`)
        .replace(/\/lab\/demo/g, `/lab/${nameKebab}`);
    writeUtf8(path.join(targetDir, 'page.tsx'), src);
})();

// README.md
(() => {
    let src = readUtf8(path.join(templateDir, 'README.md'));
    src = src
        .replace(/^#\s.*$/m, `# ${nameTitle}`)
        // второй заголовок фиксированный
        .replace(/^##\s.*$/m, `## Demo`)
        .replace(/\/lab\/demo/g, `/lab/${nameKebab}`);
    writeUtf8(path.join(targetDir, 'README.md'), src);
})();

console.log(`Демо создано: ${path.relative(root, targetDir)}`);
