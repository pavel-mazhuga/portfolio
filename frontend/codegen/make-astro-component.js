/* eslint-disable no-console */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const componentName = process.argv[2];
const componentLocation =
    process.argv.indexOf('--dir') > -1 ? process.argv[process.argv.indexOf('--dir') + 1] : 'shared/ui';

if (!componentName) {
    console.error('Please provide a component name as an argument.');
    process.exit(1);
}

const folderPath = path.join(dirname, '..', 'src', componentLocation, componentName);

if (fs.existsSync(folderPath)) {
    console.error(`${componentName} folder already exists.`);
    process.exit(1);
}

fs.mkdirSync(folderPath, { recursive: true });

/**
 * Index file
 */
const indexFilePath = path.join(folderPath, 'index.ts');
const indexFileContent = `export { default } from './${componentName}.astro';\n`;

fs.writeFileSync(indexFilePath, indexFileContent);

const toKebabCase = (str) => str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

/**
 * SCSS file
 */
const scssFilePath = path.join(folderPath, `${componentName}.scss`);
const scssFileContent = `@use '@/app/css/base/variables' as *;
@use '@/app/css/utils/mixins' as *;

.${toKebabCase(componentName)} {
}
`;

fs.writeFileSync(scssFilePath, scssFileContent);

/**
 * Astro file
 */
const astroFilePath = path.join(folderPath, `${componentName}.astro`);
const astroFileContent = `---
import type { HTMLAttributes } from 'astro/types';

export type Props = HTMLAttributes<'div'>;

const { ...props } = Astro.props;
---

<div class:list={['${toKebabCase(componentName)}', props.class]} {...props}>
    <slot />
</div>

<style lang="scss" is:global>
    @use './${componentName}';
</style>
`;

fs.writeFileSync(astroFilePath, astroFileContent);

console.log(`Astro component ${componentName} created successfully at ${folderPath}`);
