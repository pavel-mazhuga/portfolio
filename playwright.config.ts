import { PlaywrightTestConfig } from '@playwright/test';
import { baseConfig } from './playwright.config.common';

const config: PlaywrightTestConfig = {
    ...baseConfig,
};

export default config;
