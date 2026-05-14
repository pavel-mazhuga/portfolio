import node from '@astrojs/node';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { defineConfig, envField } from 'astro/config';
import { resolve } from 'path';
import { loadEnv } from 'vite';
import { IS_EXTERNAL_TEMPLATING, SSR_ENABLED } from './config';
import { generateAssetsFilesPlugin } from './plugins/vite/generate-assets-files';
import { DEFAULT_LOCALE, LOCALES } from './src/shared/config/i18n';

const { HOST, PORT = 3000 } = loadEnv(process.env.NODE_ENV || 'production', process.cwd(), '');

// https://astro.build/config
export default defineConfig({
    ...(SSR_ENABLED
        ? {
              output: 'server',
              adapter: node({ mode: 'standalone' }),
          }
        : {}),

    compressHTML: !IS_EXTERNAL_TEMPLATING,

    prefetch: true,

    server: {
        port: Number(PORT),
    },

    vite: IS_EXTERNAL_TEMPLATING
        ? {
              build: {
                  assetsInlineLimit: 0,
                  manifest: true,
                  rollupOptions: {
                      input: {
                          app: 'src/app/app.ts',
                      },
                  },
              },
              plugins: [
                  generateAssetsFilesPlugin({
                      css: {
                          src: 'src/app/app.ts',
                          dest: 'build/php_includes/css.php',
                      },
                      js: {
                          src: 'src/app/app.ts',
                          dest: 'build/php_includes/js.php',
                      },
                  }) as any,
              ],
              resolve: {
                  alias: {
                      '@': resolve(process.cwd(), 'src'),
                  },
              },
          }
        : {
              resolve: {
                  alias: {
                      '@': resolve(process.cwd(), 'src'),
                  },
              },
          },

    site: HOST,
    outDir: 'build',
    trailingSlash: 'always',

    i18n: {
        locales: LOCALES as unknown as string[],
        defaultLocale: DEFAULT_LOCALE,
    },

    env: {
        schema: {
            HOST: envField.string({ context: 'client', access: 'public' }),
            API_HOST: envField.string({ context: 'client', access: 'public' }),
        },
    },

    integrations: [
        react(),

        sitemap({
            changefreq: 'monthly',
            priority: 0.7,
            lastmod: new Date(),
            filter: (page) => {
                return !page.includes('/api/') && !page.includes('/_image/');
            },
            customSitemaps: SSR_ENABLED ? [`${HOST}/sitemap-dynamic.xml`] : [],
            serialize(item) {
                const url = new URL(item.url);
                const pathname = url.pathname;

                if (pathname === '/') {
                    // Главная страница дефолтной локали
                    item.priority = 1.0;
                } else if (pathname.match(new RegExp(`^/(${LOCALES.join('|')})/$`))) {
                    // Главные страницы локалей
                    item.priority = 1.0;
                } else {
                    // Остальные страницы
                    item.priority = 0.7;
                }

                // @ts-ignore
                item.changefreq = 'monthly';

                return item;
            },
        }),
    ],
});
