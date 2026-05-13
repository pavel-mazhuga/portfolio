import { type PlaywrightTestConfig, devices } from '@playwright/test';
import { readdirSync, statSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { loadEnv } from 'vite';

const { HOST, CI } = loadEnv(process.env.NODE_ENV || 'production', process.cwd(), '');
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Функция для получения всех статичных страниц
function getStaticPages(): string[] {
    const pagesDir = join(__dirname, 'src', 'pages');
    const pages: string[] = [];

    function scanDirectory(dir: string, basePath: string = ''): void {
        const items = readdirSync(dir);

        for (const item of items) {
            const fullPath = join(dir, item);
            const isDirectory = statSync(fullPath).isDirectory();

            if (isDirectory) {
                // Пропускаем служебные папки
                if (item === 'api' || item.startsWith('[') || item.startsWith('_')) {
                    continue;
                }

                const newBasePath = basePath ? `${basePath}/${item}` : item;
                scanDirectory(fullPath, newBasePath);
            } else {
                // Пропускаем служебные файлы и файлы с динамическими роутами
                if (item.startsWith('_') || item.startsWith('[') || item === '.DS_Store' || item.endsWith('.xml.tsx')) {
                    continue;
                }

                // Обрабатываем только .astro файлы
                if (!item.endsWith('.astro')) {
                    continue;
                }

                const fileName = item.replace(/\.astro$/, '');

                if (fileName === 'index') {
                    // Для index файлов используем путь папки
                    pages.push(basePath ? `/${basePath}` : '/');
                } else {
                    // Для обычных файлов добавляем имя файла к пути
                    const pagePath = basePath ? `/${basePath}/${fileName}` : `/${fileName}`;
                    pages.push(pagePath);
                }
            }
        }
    }

    scanDirectory(pagesDir);
    return pages.sort();
}

// Получаем все статичные страницы
export const pages = getStaticPages();

export const baseConfig: PlaywrightTestConfig = {
    testDir: './tests',
    forbidOnly: !!CI,
    retries: CI ? 1 : 0,
    timeout: 60000, // 60 секунд на весь тест
    use: {
        baseURL: HOST,
        headless: true,
        trace: 'on-first-retry',
        actionTimeout: 30000, // 30 секунд на каждое действие
        navigationTimeout: 30000, // 30 секунд на навигацию
        // httpCredentials: {
        //     username: '',
        //     password: '',
        // },
    },
    workers: CI ? 1 : undefined,
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
            fullyParallel: true,
        },
    ],
    reporter: [CI ? ['null'] : ['html']],
};
