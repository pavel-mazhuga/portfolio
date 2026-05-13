/**
 * ESLint правило для проверки использования querySelector/querySelectorAll с классами без префикса 'js-'
 * @fileoverview Требует использовать префикс 'js-' для классов в querySelector и querySelectorAll
 */

export default {
    meta: {
        type: 'problem',
        docs: {
            description: 'require js- prefix for class selectors in querySelector and querySelectorAll',
            category: 'Best Practices',
            recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
            missingJsPrefix:
                'Селектор класса "{{ selector }}" должен иметь префикс "js-". Используйте ".js-{{ className }}" вместо ".{{ className }}"',
        },
    },

    create(context) {
        /**
         * Проверяет строку селектора на наличие классов без префикса js-
         */
        function checkSelector(selectorString, node) {
            // Регулярное выражение для поиска селекторов классов
            const classSelectors = selectorString.match(/\.([a-zA-Z][\w-]*)/g);

            if (!classSelectors) return;

            classSelectors.forEach((selector) => {
                const className = selector.slice(1); // Убираем точку

                // Проверяем, что класс не начинается с js-
                if (!className.startsWith('js-')) {
                    context.report({
                        node,
                        messageId: 'missingJsPrefix',
                        data: {
                            selector,
                            className,
                        },
                    });
                }
            });
        }

        /**
         * Проверяет аргументы вызова функции
         */
        function checkCallExpression(node) {
            const { callee, arguments: args } = node;

            // Проверяем прямые вызовы querySelector/querySelectorAll
            if (
                callee.type === 'Identifier' &&
                (callee.name === 'querySelector' || callee.name === 'querySelectorAll')
            ) {
                if (args[0] && args[0].type === 'Literal' && typeof args[0].value === 'string') {
                    checkSelector(args[0].value, node);
                }
                return;
            }

            // Проверяем вызовы через объект (document.querySelector, element.querySelector и т.д.)
            if (
                callee.type === 'MemberExpression' &&
                callee.property.type === 'Identifier' &&
                (callee.property.name === 'querySelector' || callee.property.name === 'querySelectorAll')
            ) {
                if (args[0] && args[0].type === 'Literal' && typeof args[0].value === 'string') {
                    checkSelector(args[0].value, node);
                }
            }
        }

        return {
            CallExpression: checkCallExpression,
        };
    },
};
