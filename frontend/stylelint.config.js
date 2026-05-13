/** @type {import('stylelint').Config} */
export default {
    extends: ['stylelint-config-standard-scss', 'stylelint-config-html'],
    plugins: [
        './plugins/stylelint/stylelint-plugin-no-hover.js',
        './plugins/stylelint/stylelint-plugin-no-transition-all.js',
        './plugins/stylelint/stylelint-plugin-no-nested-tag-selectors.js',
    ],
    rules: {
        'font-family-name-quotes': null,
        'scss/dollar-variable-empty-line-before': null,
        'color-function-alias-notation': null,
        'alpha-value-notation': null,
        // Отключаем правило для BEM-селекторов
        'selector-class-pattern': null,
        // Разрешаем использование @import в SCSS
        'at-rule-no-unknown': null,
        'scss/at-rule-no-unknown': true,
        // Настройки для вложенности
        'max-nesting-depth': 4,
        // Настройки для селекторов
        'selector-max-id': 1,
        'selector-max-type': 4,
        // Разрешаем использование vendor prefixes
        'property-no-vendor-prefix': null,
        'value-no-vendor-prefix': null,
        // Разрешаем пустые комментарии
        'scss/comment-no-empty': null,
        // Разрешаем переносы строк в операторах
        'scss/operator-no-newline-after': null,
        // Отключаем правило для пустых источников
        'no-empty-source': null,
        'block-no-empty': true,
        // Разрешаем нисходящую специфичность (для normalize.css и подобных)
        'no-descending-specificity': null,
        // Разрешаем использование глобальных функций SCSS
        'scss/no-global-function-names': null,
        // Запрещаем автоматическое изменение max-width
        'media-feature-name-no-unknown': null,
        'media-feature-range-notation': null,
        // Запрещаем автоматическое изменение rgba(0, 0, 0, 0)
        'color-named': null,
        'color-hex-length': null,
        // Запрещаем удаление единиц измерения (важно для CSS переменных)
        'length-zero-no-unit': null,
        // Запрещаем изменение currentColor
        'color-function-notation': null,
        'scss/double-slash-comment-empty-line-before': null,
        'value-keyword-case': null,
        // бан на конкатенацию селекторов
        'selector-disallowed-list': ['/^&__+/', '/^&--+/'],
        'selector-pseudo-element-colon-notation': 'double',
        'selector-pseudo-class-no-unknown': [
            true,
            {
                ignorePseudoClasses: ['global'],
            },
        ],
        'declaration-no-important': true,
        'at-rule-empty-line-before': null,
        'scss/at-mixin-argumentless-call-parentheses': null,
        'declaration-block-no-redundant-longhand-properties': null,
        // Custom
        'custom/no-hover': true,
        'custom/no-nested-tag-selectors': true,
        'custom/no-transition-all': true,
    },
    overrides: [
        {
            files: ['**/*.astro', '**/*.html'],
            rules: {
                'custom-property-empty-line-before': null,
            },
        },
    ],
    ignoreFiles: ['build/**/*', 'node_modules/**/*', 'static/**/*'],
};
