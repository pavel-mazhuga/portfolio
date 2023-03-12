import { PlaywrightTestConfig, devices } from '@playwright/test';

// поменять/добавить страницы
export const pages = [''];

export const baseConfig: PlaywrightTestConfig = {
    testDir: './tests',
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    // webServer: {
    //     command: 'npm run start',
    //     url: 'http://localhost:3000',
    //     timeout: 60 * 1000,
    //     reuseExistingServer: !process.env.CI,
    // },
    use: {
        baseURL: 'http://localhost:3000',
        headless: true,
        trace: 'on-first-retry',
    },
    workers: process.env.CI ? 2 : undefined,
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
            fullyParallel: true,
        },
    ],
    reporter: [process.env.CI ? ['null'] : ['html']],
};
