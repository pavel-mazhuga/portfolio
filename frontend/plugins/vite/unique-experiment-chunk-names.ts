import type { Plugin } from 'vite';

const EXPERIMENT_DIR_RE = /[/\\]experiments[/\\]([^/\\]+)[/\\]/;

/**
 * Каждое демо лаборатории — это `experiments/<slug>/Demo.ts`, поэтому по умолчанию все они
 * получают одно имя чанка (`Demo.<hash>.js`). Chrome хранит ровно один словарь сжатия на один
 * match-паттерн (в его базе `UNIQUE INDEX` по `frame_origin, top_frame_site, host, match,
 * match_dest`), так что три десятка несвязанных чанков дерутся за один слот `/_astro/Demo*.js`
 * и словарное сжатие почти никогда не срабатывает. Уникальное имя даёт каждому демо свой слот.
 *
 * Имя подменяется в `outputOptions`, а не через `vite.build.rollupOptions`, потому что Astro
 * задаёт `chunkFileNames` клиентской сборки сам и перетирает пользовательский конфиг.
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
