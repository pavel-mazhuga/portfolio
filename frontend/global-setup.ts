import { type FullConfig } from '@playwright/test';
import dotenv from 'dotenv';

async function globalSetup(config: FullConfig) {
    dotenv.config({
        path: '.env',
        override: true,
    });
}

export default globalSetup;
