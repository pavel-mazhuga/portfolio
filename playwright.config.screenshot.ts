import { PlaywrightTestConfig } from '@playwright/test';
import { baseConfig } from './playwright.config.common';

const config: PlaywrightTestConfig = {
    ...baseConfig,
    webServer: {
        command: `start-storybook -p 6006 --quiet --no-open ${
            process.env.CI ? '--ci' : ''
        }`,
        url: 'http://localhost:6006',
        timeout: 60 * 1000,
        // reuseExistingServer: !process.env.CI,
        reuseExistingServer: true,
    },
    reporter: process.env.CI ? 'list' : 'html',
};
export default config;
