/* eslint-disable no-console */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const ICONS_DIR = path.join(dirname, '../public/static/icons');
const TYPES_FILE = path.join(dirname, '../src/shared/ui/Icon/types.generated.ts');
const ICONS_LIST_FILE = path.join(dirname, '../public/static/icons/icons-list.json');

function generateIconTypes() {
    try {
        const files = fs.readdirSync(ICONS_DIR);
        const iconNames = files
            .filter((file) => file.endsWith('.svg'))
            .map((file) => file.replace('.svg', ''))
            .sort();

        // Генерируем типы
        const typeContent =
            iconNames.length > 0
                ? `export type IconName = ${iconNames.map((name) => `'${name}'`).join(' | ')};\n`
                : 'export type IconName = never;\n';

        fs.writeFileSync(TYPES_FILE, typeContent);

        const iconsListContent = JSON.stringify(iconNames, null, 2);
        fs.writeFileSync(ICONS_LIST_FILE, iconsListContent);

        console.log(`✅ Generated types for ${iconNames.length} icons: ${iconNames.join(', ')}`);
        console.log(`✅ Generated JSON list for Storybook: ${ICONS_LIST_FILE}`);
    } catch (error) {
        console.error('❌ Error generating icon types:', error.message);
        process.exit(1);
    }
}

generateIconTypes();
