import type { Plugin } from 'vite';

const EXPERIMENT_DIR_RE = /[/\\]experiments[/\\]([^/\\]+)[/\\]/;

/**
 * Each lab demo is `experiments/<slug>/Demo.ts`, so by default they all get the same chunk
 * name (`Demo.<hash>.js`). Chrome stores exactly one compression dictionary per match pattern
 * (DB `UNIQUE INDEX` on `frame_origin, top_frame_site, host, match, match_dest`), so ~30
 * unrelated chunks fight for one `/_astro/Demo*.js` slot and dictionary compression almost never hits. Unique names give each demo its own slot.
 *
 * Rename happens in `outputOptions`, not `vite.build.rollupOptions`, because Astro sets
 * client `chunkFileNames` itself and overwrites user config.
 */
export const uniqueExperimentChunkNamesPlugin = (): Plugin => ({
    name: 'unique-experiment-chunk-names',
    enforce: 'post',
    apply: 'build',

    outputOptions(options) {
        if (this.environment?.name !== 'client') return null;

        const fallback = options.chunkFileNames ?? '_astro/[name].[hash].js';

        options.chunkFileNames = (chunk) => {
            const slug = chunk.facadeModuleId?.match(EXPERIMENT_DIR_RE)?.[1];

            if (!slug) return typeof fallback === 'function' ? fallback(chunk) : fallback;

            return `_astro/${slug}.${chunk.name}.[hash].js`;
        };

        return options;
    },
});
