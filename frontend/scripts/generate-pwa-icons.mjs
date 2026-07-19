import { mkdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
// Favicon already lives next to PNG outputs (unlike boilerplate's public/static/favicon.svg).
const srcSvg = join(root, 'public/static/img/favicon.svg');
const outDir = join(root, 'public/static/img');

/** Portfolio mark is black square + white glyph — rasterize as-is on black canvas. */
const writePng = async (name, size, { padRatio = 0 } = {}) => {
    const svg = await readFile(srcSvg);
    const logoSize = Math.round(size * (1 - padRatio * 2));
    const offset = Math.round((size - logoSize) / 2);

    const logo = await sharp(svg).resize(logoSize, logoSize, { fit: 'contain' }).png().toBuffer();

    await sharp({
        create: {
            width: size,
            height: size,
            channels: 3,
            background: '#000000',
        },
    })
        .composite([{ input: logo, left: offset, top: offset }])
        .png()
        .toFile(join(outDir, name));

    console.log(`wrote ${name} (${size}x${size})`);
};

await mkdir(outDir, { recursive: true });

await writePng('icon-192.png', 192);
await writePng('icon-512.png', 512);
await writePng('icon-maskable-512.png', 512, { padRatio: 0.1 }); // ~80% safe zone
await writePng('apple-touch-icon.png', 180);

console.log('PWA icons ready in public/static/img/');
