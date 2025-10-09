#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const labRoot = path.join(root, 'src', 'app', 'lab');
const templateDir = path.join(labRoot, 'demo');

const nameKebab = process.argv[2];

if (!nameKebab) {
    console.error('Specify the demo name: npm run demo <demo-name-kebab-case>');
    process.exit(1);
}

if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(nameKebab)) {
    console.error('The name must be in kebab-case: only lowercase letters, numbers and dashes.');
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
    console.error(`Folder already exists: ${targetDir}`);
    process.exit(1);
}

if (!fs.existsSync(templateDir)) {
    console.error(`Template not found: ${templateDir}`);
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

// experience.tsx (always import and use Demo)
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
        // second fixed heading
        .replace(/^##\s.*$/m, `## Demo`)
        .replace(/\/lab\/demo/g, `/lab/${nameKebab}`);
    writeUtf8(path.join(targetDir, 'README.md'), src);
})();

console.log(`Demo has been created: ${path.relative(root, targetDir)}`);
