/// <reference types="vitest" />
import { getViteConfig } from 'astro/config';
import { defineConfig } from 'vitest/config';
import astroConfig from './astro.config';

export default defineConfig({
    ...getViteConfig(
        {
            // Astro config
        },
        {
            site: astroConfig.site,
            trailingSlash: astroConfig.trailingSlash,
        },
    ),
    test: {
        globals: true,
        environment: 'jsdom',
        exclude: [
            '**/node_modules/**',
            '**/dist/**',
            '**/cypress/**',
            '**/.{idea,git,cache,output,temp}/**',
            '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
            'tests/general/**',
            'tests/lighthouse/**',
            'tests/meta-tags/**',
        ],
    },
});
