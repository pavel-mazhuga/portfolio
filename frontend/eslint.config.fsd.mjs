/* eslint-disable import/no-internal-modules */
import { defineConfig } from 'eslint/config';
import fsdLayerImportRestrictions from './plugins/eslint/fsd-layer-import-restrictions.js';

export default defineConfig({
    plugins: {
        fsd: {
            rules: {
                'layer-import-restrictions': fsdLayerImportRestrictions,
            },
        },
    },
    rules: {
        'fsd/layer-import-restrictions': 'warn',
    },
});
