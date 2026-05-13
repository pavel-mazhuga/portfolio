import * as fs from 'fs/promises';
import * as path from 'path';
import type { Plugin, ViteDevServer } from 'vite';

interface GenerateAssetsFilesOptions {
    css: {
        src: string;
        dest: string;
    };
    js: {
        src: string;
        dest: string;
    };
}

export const generateAssetsFilesPlugin = (options: GenerateAssetsFilesOptions): Plugin => ({
    name: 'generate-assets-files',

    async configureServer(server: ViteDevServer) {
        // Пытаемся определить, что это действительно dev-режим для разработчика
        const isProd = process.env.NODE_ENV === 'production' || process.argv.includes('build');
        if (server.config.command !== 'serve' || isProd) return;

        const serverUrl = `http://localhost:${server.config.server.port}`;
        const cssContent = `<link rel="stylesheet" href="${serverUrl}/${options.css.src}">`;
        const jsContent = `<script type="module" src="${serverUrl}/${options.js.src}"></script>`;

        await fs.mkdir(path.dirname(options.css.dest), { recursive: true });
        await fs.mkdir(path.dirname(options.js.dest), { recursive: true });

        await fs.writeFile(options.css.dest, cssContent);
        await fs.writeFile(options.js.dest, jsContent);
    },

    async writeBundle(_options, bundle) {
        let cssFile: string | undefined;
        let jsFile: string | undefined;

        // Поиск в бандле намного надежнее чтения манифеста с диска
        for (const [fileName, chunk] of Object.entries(bundle)) {
            if (chunk.type === 'chunk') {
                const isOurJs =
                    chunk.facadeModuleId?.includes(options.js.src) ||
                    chunk.moduleIds.some((id) => id.includes(options.js.src));

                if (isOurJs) {
                    jsFile = fileName;
                    if (chunk.viteMetadata?.importedCss?.size) {
                        cssFile = Array.from(chunk.viteMetadata.importedCss)[0];
                    }
                }
            }
        }

        // Запасной вариант для CSS
        if (!cssFile) {
            for (const [fileName, asset] of Object.entries(bundle)) {
                if (asset.type === 'asset' && fileName.endsWith('.css')) {
                    if (fileName.includes('index') || fileName.includes('app')) {
                        cssFile = fileName;
                    }
                }
            }
        }

        if (jsFile || cssFile) {
            await fs.mkdir(path.dirname(options.css.dest), { recursive: true });
            await fs.mkdir(path.dirname(options.js.dest), { recursive: true });

            if (cssFile) {
                const cssContent = `<link rel="stylesheet" href="/local/templates/main/frontend/build/${cssFile}">`;
                await fs.writeFile(options.css.dest, cssContent);
            }

            if (jsFile) {
                const jsContent = `<script type="module" src="/local/templates/main/frontend/build/${jsFile}"></script>`;
                await fs.writeFile(options.js.dest, jsContent);
            }
        }
    },
});
