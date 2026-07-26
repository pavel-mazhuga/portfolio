import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { dczVariantName, encodeDcz, isZstdAvailable, MAX_WINDOW_SIZE, parseAssetName, sha256 } from './encode.mjs';

const ROOT = path.join(import.meta.dirname, '../..');
const PREV_DIR = path.join(ROOT, '.dcz-prev/_astro');
const ASTRO_DIRS = [path.join(ROOT, 'build/_astro'), path.join(ROOT, 'build/client/_astro')];

const LEVEL = Number(process.env.DCZ_LEVEL ?? 19);
/** ngx_brotli default quality — the variant only makes sense if it beats what nginx serves. */
const BROTLI_QUALITY = 6;
const MAX_RATIO_VS_BROTLI = 0.9;
const MIN_SAVED_BYTES = 1024;
/**
 * pairs grow as O(dictionaries × targets) inside a chunk family, so the run is
 * capped instead of being smart about it. If a family ever gets big enough to hit these,
 * pick dictionaries by traffic data instead of generating every pair.
 */
const MAX_PAIRS = 1200;
const MAX_OUTPUT_BYTES = 20 * 1024 * 1024;

const formatBytes = (bytes) =>
    bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;

const readAssets = (dir) =>
    fs.existsSync(dir)
        ? fs
              .readdirSync(dir)
              .map((name) => ({ name, groups: parseAssetName(name) }))
              .filter(({ groups }) => groups !== null)
              .map(({ name, groups }) => ({
                  name,
                  ...groups,
                  key: `${groups.family}.${groups.ext}`,
                  data: fs.readFileSync(path.join(dir, name)),
              }))
        : [];

const astroDir = ASTRO_DIRS.find((dir) => fs.existsSync(dir));

if (!astroDir) {
    console.warn('[dcz] no build/_astro directory, nothing to do');
    process.exit(0);
}

const current = readAssets(astroDir);

fs.writeFileSync(
    path.join(astroDir, 'dcz-manifest.json'),
    `${JSON.stringify(
        {
            assets: current.map(({ name, data }) => ({
                name,
                size: data.length,
                sha256: sha256(data).toString('hex'),
            })),
        },
        null,
        2,
    )}\n`,
);

if (!isZstdAvailable) {
    console.warn(`[dcz] zstd is unavailable in Node ${process.version} (needs >=22.19), skipping variants`);
    process.exit(0);
}

const previous = readAssets(PREV_DIR);

if (previous.length === 0) {
    console.warn(`[dcz] no previous build in ${path.relative(ROOT, PREV_DIR)}, only same-build pairs will be built`);
}

const families = new Map();

// A chunk that survived the deploy untouched appears in both builds under the same name.
const dictionaries = new Map([...previous, ...current].map((asset) => [asset.name, asset]));

for (const asset of dictionaries.values()) {
    const family = families.get(asset.key) ?? { targets: [], dictionaries: [] };
    families.set(asset.key, family);
    family.dictionaries.push(asset);
}

for (const asset of current) {
    families.get(asset.key).targets.push(asset);
}

const bySizeDesc = (a, b) => b.data.length - a.data.length;
const totalSize = (assets) => assets.reduce((sum, { data }) => sum + data.length, 0);

const sorted = [...families.values()]
    .map((family) => ({
        targets: family.targets.sort(bySizeDesc),
        dictionaries: family.dictionaries.sort(bySizeDesc),
    }))
    .sort((a, b) => totalSize(b.targets) - totalSize(a.targets));

const stats = { variants: 0, written: 0, brotli: 0, dcz: 0, skipped: 0, capped: 0 };
let best = null;

for (const { targets, dictionaries } of sorted) {
    for (const target of targets) {
        const brotliSize = zlib.brotliCompressSync(target.data, {
            params: { [zlib.constants.BROTLI_PARAM_QUALITY]: BROTLI_QUALITY },
        }).length;

        for (const dictionary of dictionaries) {
            if (dictionary.name === target.name) continue;
            if (dictionary.data.length + target.data.length >= MAX_WINDOW_SIZE) {
                stats.skipped += 1;
                continue;
            }

            if (stats.variants >= MAX_PAIRS || stats.written >= MAX_OUTPUT_BYTES) {
                stats.capped += 1;
                continue;
            }

            const variant = encodeDcz(target.data, dictionary.data, LEVEL);

            if (variant.length > brotliSize * MAX_RATIO_VS_BROTLI || brotliSize - variant.length < MIN_SAVED_BYTES) {
                stats.skipped += 1;
                continue;
            }

            fs.writeFileSync(path.join(astroDir, dczVariantName(target.name, dictionary.hash)), variant);

            stats.variants += 1;
            stats.written += variant.length;
            stats.brotli += brotliSize;
            stats.dcz += variant.length;

            if (!best || brotliSize - variant.length > best.saved) {
                best = {
                    target: target.name,
                    dictionary: dictionary.name,
                    brotliSize,
                    saved: brotliSize - variant.length,
                };
            }
        }
    }
}

console.log(
    `[dcz] ${stats.variants} variants, ${formatBytes(stats.written)} on disk, ` +
        `${formatBytes(stats.brotli)} of brotli traffic becomes ${formatBytes(stats.dcz)} ` +
        `(${stats.skipped} pairs skipped, ${stats.capped} over cap)`,
);

if (best) {
    console.log(
        `[dcz] best pair: ${best.target} with ${best.dictionary} as dictionary, ` +
            `${formatBytes(best.brotliSize)} brotli -> ${formatBytes(best.brotliSize - best.saved)}`,
    );
}

/**
 * Chrome does not register a dedicated worker's top-level script as a dictionary — the
 * writer flag is only set for fetches made from a document or from inside a worker — so the
 * pages that start the worker advertise the chunk through the link relation instead. The
 * fetch is idle-priority and hits the HTTP cache entry the worker itself created.
 */
const WORKER_URL_RE = /new Worker\(\s*new URL\(\s*[`'"]\/_astro\/([\w.-]+\.js)/g;

const htmlFiles = fs
    .readdirSync(path.dirname(astroDir), { recursive: true })
    .filter((name) => name.endsWith('.html'))
    .map((name) => path.join(path.dirname(astroDir), name));

let patched = 0;

for (const { name, data } of current) {
    if (name.endsWith('.css')) continue;

    const workers = [...new Set([...data.toString().matchAll(WORKER_URL_RE)].map(([, worker]) => worker))];
    if (workers.length === 0) continue;

    const links = workers.map((worker) => `<link rel="compression-dictionary" href="/_astro/${worker}">`).join('');

    for (const file of htmlFiles) {
        const html = fs.readFileSync(file, 'utf8');
        if (!html.includes(name)) continue;

        fs.writeFileSync(file, html.replace('</head>', `${links}</head>`));
        patched += 1;
    }
}

if (patched > 0) {
    console.log(`[dcz] advertised worker chunks as dictionaries in ${patched} HTML file(s)`);
}
