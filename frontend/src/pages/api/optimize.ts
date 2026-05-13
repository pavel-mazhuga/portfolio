import type { APIRoute } from 'astro';
import { API_HOST } from 'astro:env/client';
import crypto from 'crypto';
import { constants, promises as fs } from 'fs';
import type { PathLike } from 'fs';
import { cpus } from 'os';
import path from 'path';
import sharp from 'sharp';

const USE_AVIF = false;
const MIN_WIDTH = 1;
const MAX_WIDTH = 3840; // 4K
const MIN_QUALITY = 1;
const MAX_QUALITY = 100;
const ALLOWED_FORMATS = ['avif', 'webp'] as const;
const DEFAULT_FORMAT: (typeof ALLOWED_FORMATS)[number] = 'webp';
const DEFAULT_QUALITY = '75';
const DEFAULT_WIDTH = '3840';

const queue = new Map<string, Promise<Buffer>>();
const MAX_CONCURRENT_PROCESSES = Math.max(1, Math.floor(cpus().length / 2)); // максимум одновременных процессов в зависимости от количества ядер CPU

sharp.concurrency(MAX_CONCURRENT_PROCESSES);
let currentProcesses = 0;

const processImage = async (
    data: Buffer,
    src: string,
    width: string,
    quality: string,
    format: string,
): Promise<Buffer> => {
    // Ждем, пока освободится слот для обработки
    while (currentProcesses >= MAX_CONCURRENT_PROCESSES) {
        await new Promise((resolve) => setTimeout(resolve, 100));
    }

    currentProcesses++;

    try {
        let sharpInstance = sharp(data).resize({
            withoutEnlargement: true,
            width: parseInt(width),
        });

        if (format === 'webp') {
            sharpInstance = sharpInstance.webp({ quality: parseInt(quality) });
        } else if (format === 'avif') {
            sharpInstance = sharpInstance.avif({ quality: parseInt(quality) });
        }

        return sharpInstance.toBuffer();
    } finally {
        currentProcesses--;
    }
};

const sha = (x: crypto.BinaryLike) => crypto.createHash('sha256').update(x).digest('hex');

const getCacheDir = (() => {
    const cacheDir = path.resolve('@/../.images_cache');
    let prom: Promise<string>;

    return () =>
        (prom =
            prom ||
            (async () => {
                await fs.mkdir(cacheDir, { recursive: true });

                return cacheDir;
            })());
})();

const fileExists = async (file: PathLike) => {
    try {
        await fs.access(file, constants.F_OK);

        return true;
    } catch {
        return false;
    }
};

const validateParams = (width: string, quality: string, format: string) => {
    const widthNum = parseInt(width);
    const qualityNum = parseInt(quality);

    if (isNaN(widthNum) || widthNum < MIN_WIDTH || widthNum > MAX_WIDTH) {
        throw new Error(`Width must be between ${MIN_WIDTH} and ${MAX_WIDTH}`);
    }

    if (isNaN(qualityNum) || qualityNum < MIN_QUALITY || qualityNum > MAX_QUALITY) {
        throw new Error(`Quality must be between ${MIN_QUALITY} and ${MAX_QUALITY}`);
    }

    if (!ALLOWED_FORMATS.includes(format as (typeof ALLOWED_FORMATS)[number])) {
        throw new Error(`Format must be one of: ${ALLOWED_FORMATS.join(', ')}`);
    }
};

export const GET: APIRoute = async ({ request }) => {
    try {
        const url = new URL(request.url);
        const rawSrc = url.searchParams.get('src');
        const src = rawSrc ? decodeURIComponent(rawSrc) : '';
        const width = url.searchParams.get('w') || DEFAULT_WIDTH;
        let quality = url.searchParams.get('q') || DEFAULT_QUALITY;
        let format = url.searchParams.get('format') || DEFAULT_FORMAT;
        const isImageFromFrontend = /^\/static\//.test(src);
        const isImageFromBackend = /^\/storage\/(settings|media)\//.test(src);

        const allowedHost = API_HOST;
        const isAbsoluteUrl = /^https?:\/\//.test(src);
        const isAllowedAbsoluteUrl =
            isAbsoluteUrl && (src.startsWith(`https://${allowedHost}`) || src.startsWith(`http://${allowedHost}`));

        if (
            typeof src !== 'string' ||
            src.includes('..') ||
            src.includes('./') ||
            (isAbsoluteUrl && !isAllowedAbsoluteUrl)
        ) {
            return new Response('400 Bad Request', { status: 400 });
        }

        if (!/(png|jpe?g|webp|avif)$/.test(src)) {
            return new Response('400 Bad Request: Unsupported file type', { status: 400 });
        }

        if (!isImageFromFrontend && !isImageFromBackend) {
            return new Response('403 Forbidden: Access denied', { status: 403 });
        }

        const cacheDir = await getCacheDir();

        // Проверяем поддержку AVIF в заголовках Accept
        const acceptHeader = request.headers.get('accept') || '';
        const avifSupported = USE_AVIF && acceptHeader.includes('image/avif');

        if (avifSupported && format !== 'avif') {
            format = 'avif';
            quality = Math.max(MIN_QUALITY, parseInt(quality) - 20).toString();
        }

        if (!src) {
            return new Response(JSON.stringify({ error: 'URL is missing' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        try {
            validateParams(width, quality, format);
        } catch (err) {
            return new Response(
                JSON.stringify({
                    error: err instanceof Error ? err.message : 'Invalid parameters',
                }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                },
            );
        }

        const host = isImageFromBackend ? API_HOST.replace(/^https?\:\/\//, '') : url.host;
        const protocol = /^(localhost|127.0.0.1)(:\d+)?$/.test(host) ? 'http:' : 'https:';
        const origin = `${protocol}//${host}`;

        const cacheFile = path.join(cacheDir, sha(sha(src) + sha(width) + sha(quality) + sha(format)));

        if (await fileExists(cacheFile)) {
            const cachedFile = await fs.readFile(cacheFile);

            return new Response(new Uint8Array(cachedFile), {
                status: 200,
                headers: {
                    'Cache-Control': 'public, max-age=31536000, must-revalidate',
                    'Content-Type': `image/${format}`,
                },
            });
        }

        // Используем ключ запроса для дедупликации одинаковых запросов
        const requestKey = `${src}-${width}-${quality}-${format}`;
        let processingPromise = queue.get(requestKey);

        if (!processingPromise) {
            const response = await fetch(origin + src);

            if (!response.ok) {
                return new Response(`HTTP ${response.status}: ${response.statusText}`, {
                    status: response.status,
                });
            }

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            // Генерируем AVIF в фоне только при первом запросе WebP
            processingPromise = processImage(buffer, src, width, quality, format);
            queue.set(requestKey, processingPromise);

            processingPromise.finally(() => {
                queue.delete(requestKey);
            });

            if (format === 'avif') {
                processingPromise.then((result) => {
                    if (avifSupported ? format === 'avif' : true) {
                        fs.writeFile(cacheFile, result as unknown as DataView);
                    }
                });

                // AVIF долго генерируется, поэтому отправляем на клиент исходный файл, пока генерация в процессе
                return new Response(arrayBuffer, {
                    status: 200,
                    headers: {
                        'Cache-Control': 'public, max-age=180, must-revalidate',
                        'Content-Type': `image/${path.extname(src).toLowerCase().replace('.', '').replace('jpg', 'jpeg')}`,
                    },
                });
            }

            // Webp генерируется довольно быстро, поэтому ждем результат
            const result = await processingPromise;
            const optimized = result;

            if (avifSupported ? format === 'avif' : true) {
                fs.writeFile(cacheFile, optimized as unknown as DataView);
            }

            return new Response(new Uint8Array(optimized), {
                status: 200,
                headers: {
                    'Cache-Control': 'public, max-age=31536000, must-revalidate',
                    'Content-Type': `image/${path.extname(src).toLowerCase().replace('.', '').replace('jpg', 'jpeg')}`,
                },
            });
        }

        // Если processingPromise уже существует, ждем его завершения
        const result = await processingPromise;

        return new Response(new Uint8Array(result), {
            status: 200,
            headers: {
                'Cache-Control': 'public, max-age=31536000, must-revalidate',
                'Content-Type': `image/${path.extname(src).toLowerCase().replace('.', '').replace('jpg', 'jpeg')}`,
            },
        });
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Image optimization error:', err);

        const status = 500;

        return new Response(
            JSON.stringify({
                error: 'Image processing failed',
                details: err instanceof Error ? err.message : 'Unknown error',
            }),
            {
                status,
                headers: { 'Content-Type': 'application/json' },
            },
        );
    }
};
