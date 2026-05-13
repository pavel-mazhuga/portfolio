/* eslint-disable import/no-internal-modules */
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import astroParser from 'astro-eslint-parser';
import eslintPluginAstro from 'eslint-plugin-astro';
import noUnsanitized from 'eslint-plugin-no-unsanitized';
import sonarjs from 'eslint-plugin-sonarjs';
import { defineConfig } from 'eslint/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import tseslint from 'typescript-eslint';
import { IS_EXTERNAL_TEMPLATING } from './config.js';
import fsdConfig from './eslint.config.fsd.mjs';
import noClassSelectorWithoutJsPrefix from './plugins/eslint/no-class-selector-without-js-prefix.js';
import noUnsanitizedSetHtml from './plugins/eslint/no-unsanitized-set-html.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
});

const publicApiPlugin = compat.extends('@feature-sliced/eslint-config/rules/public-api/lite');

export default defineConfig([
    ...eslintPluginAstro.configs.recommended,
    ...compat.extends('@feature-sliced/eslint-config/rules/public-api/lite', 'prettier'),
    ...publicApiPlugin,
    fsdConfig,
    {
        files: ['**/*.{js,jsx,ts,tsx}'],
        plugins: {
            sonarjs,
            '@stylistic': stylistic,
            '@typescript-eslint': tseslint.plugin,
            'no-unsanitized': noUnsanitized,
            custom: {
                rules: {
                    'no-class-selector-without-js-prefix': noClassSelectorWithoutJsPrefix,
                },
            },
        },
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
            },
        },
        rules: {
            'no-eval': 'error',
            'no-implied-eval': 'error',
            'no-new-func': 'error',
            'no-unsanitized/method': 'error',
            'no-unsanitized/property': [
                'error',
                {
                    escape: {
                        taggedTemplates: ['Sanitizer.escapeHTML', 'escapeHTML'],
                        methods: ['Sanitizer.unwrapSafeHTML', 'unwrapSafeHTML', 'DOMPurify.sanitize'],
                    },
                },
            ],
            'no-console': ['warn'],
            'import/no-internal-modules': [
                'error',
                {
                    allow: [...publicApiPlugin[0].rules['import/no-internal-modules'][1].allow, '@icons/*'],
                },
            ],
            '@typescript-eslint/naming-convention': [
                'error',
                {
                    selector: 'typeLike',
                    format: ['PascalCase'],
                },
            ],
            '@typescript-eslint/no-unused-vars': 'warn',
            '@stylistic/padding-line-between-statements': [
                'error',
                { blankLine: 'always', prev: '*', next: 'return' },
                { blankLine: 'always', prev: '*', next: 'for' },
                { blankLine: 'always', prev: '*', next: 'while' },
                { blankLine: 'always', prev: '*', next: 'switch' },
                { blankLine: 'always', prev: '*', next: 'if' },
                { blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
                { blankLine: 'any', prev: ['const', 'let', 'var'], next: ['const', 'let', 'var'] },
                { blankLine: 'always', prev: 'directive', next: '*' },
                { blankLine: 'any', prev: 'directive', next: 'directive' },
                { blankLine: 'always', prev: ['case', 'default'], next: '*' },
            ],
            'sonarjs/class-name': 'error',
            'sonarjs/class-prototype': 'error',
            'sonarjs/code-eval': 'error',
            'sonarjs/deprecation': 'warn',
            'sonarjs/fixme-tag': 'warn',
            'sonarjs/inconsistent-function-call': 'error',
            'sonarjs/link-with-target-blank': 'error',
            'sonarjs/new-operator-misuse': 'error',
            'sonarjs/no-array-delete': 'error',
            'sonarjs/no-associative-arrays': 'error',
            'sonarjs/no-built-in-override': 'error',
            'sonarjs/no-commented-code': 'warn',
            'sonarjs/no-delete-var': 'error',
            'sonarjs/no-duplicate-in-composite': 'error',
            'sonarjs/no-element-overwrite': 'error',
            'sonarjs/no-fallthrough': 'error',
            'sonarjs/no-global-this': 'error',
            'sonarjs/no-gratuitous-expressions': 'error',
            'sonarjs/no-hardcoded-ip': 'error',
            'sonarjs/no-hardcoded-passwords': 'error',
            'sonarjs/no-hardcoded-secrets': 'warn',
            'sonarjs/no-identical-conditions': 'error',
            'sonarjs/no-identical-expressions': 'error',
            'sonarjs/no-identical-functions': 'error',
            'sonarjs/no-ignored-exceptions': 'error',
            'sonarjs/no-implicit-global': 'error',
            'sonarjs/no-in-misuse': 'warn',
            'sonarjs/no-inconsistent-returns': 'error',
            'sonarjs/no-incorrect-string-concat': 'error',
            'sonarjs/no-inverted-boolean-check': 'error',
            'sonarjs/no-labels': 'error',
            'sonarjs/no-nested-conditional': 'warn',
            'sonarjs/no-primitive-wrappers': 'error',
            'sonarjs/no-redundant-assignments': 'warn',
            'sonarjs/no-redundant-jump': 'error',
            'sonarjs/no-redundant-optional': 'error',
            'sonarjs/no-redundant-parentheses': 'warn',
            'sonarjs/no-return-type-any': 'warn',
            'sonarjs/no-same-line-conditional': 'error',
            'sonarjs/no-skipped-tests': 'error',
            'sonarjs/no-small-switch': 'warn',
            'sonarjs/no-undefined-argument': 'error',
            // 'sonarjs/no-undefined-assignment': 'error',
            'sonarjs/no-uniq-key': 'error',
            'sonarjs/no-unthrown-error': 'warn',
            'sonarjs/no-use-of-empty-return-value': 'error',
            'sonarjs/no-useless-catch': 'error',
            'sonarjs/non-existent-operator': 'error',
            'sonarjs/post-message': 'error',
            'sonarjs/prefer-default-last': 'error',
            'sonarjs/prefer-immediate-return': 'warn',
            'sonarjs/prefer-promise-shorthand': 'warn',
            'sonarjs/prefer-single-boolean-return': 'error',
            'sonarjs/prefer-while': 'error',
            'sonarjs/reduce-initial-value': 'error',
            'sonarjs/todo-tag': 'warn',
            'sonarjs/unused-import': 'warn',
            'sonarjs/variable-name': 'error',
            'custom/no-class-selector-without-js-prefix': 'error',
        },
    },
    {
        files: ['**/*.stories.tsx', '**/*.stories.ts', '**/*.stories.js'],
        rules: {
            'sonarjs/no-built-in-override': 'off',
        },
    },
    {
        files: ['**/*.tsx'],
        rules: {
            'sonarjs/no-inconsistent-returns': 'off',
        },
    },
    {
        files: ['**/*.astro'],
        plugins: {
            astro: eslintPluginAstro,
            sonarjs,
            custom: {
                rules: {
                    'no-unsanitized-set-html': noUnsanitizedSetHtml,
                },
            },
        },
        languageOptions: {
            parser: astroParser, // Use astro-eslint-parser for .astro files
            parserOptions: {
                parser: tseslint.parser, // Chain to TypeScript for frontmatter
                extraFileExtensions: ['.astro'], // Allow .astro in TS parser
                ecmaVersion: 'latest',
                sourceType: 'module',
                ecmaFeatures: { jsx: true }, // Enable JSX support for Astro templates
            },
        },
        rules: {
            'custom/no-unsanitized-set-html': 'error',
            ...(IS_EXTERNAL_TEMPLATING
                ? {
                      'no-restricted-syntax': [
                          'error',
                          {
                              selector: "JSXElement > JSXOpeningElement > JSXIdentifier[name='style']",
                              message: 'Использование тега <style> запрещено. Используйте внешние SCSS-файлы.',
                          },
                          {
                              selector: "JSXElement > JSXOpeningElement > JSXIdentifier[name='script']",
                              message: 'Использование тега <script> запрещено. Выносите логику во внешние JS/TS-файлы.',
                          },
                      ],
                  }
                : {}),
        },
    },
]);
