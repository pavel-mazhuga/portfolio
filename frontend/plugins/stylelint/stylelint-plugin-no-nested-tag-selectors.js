import stylelint from 'stylelint';

const ruleName = 'custom/no-nested-tag-selectors';
const messages = stylelint.utils.ruleMessages(ruleName, {
    rejected: 'Запрещено использовать селекторы по тегу в каскаде. Используйте классы вместо вложенных тегов.',
});

function isTagSelector(selector) {
    // Убираем псевдоклассы и псевдоэлементы для проверки базового селектора
    const cleanSelector = selector.split(':')[0].trim();
    // Проверяем, является ли селектор тегом (не содержит . # [ и другие специальные символы)
    const tagPattern = /^[a-zA-Z][a-zA-Z0-9]*$/;
    return tagPattern.test(cleanSelector);
}

function isAllowedTag(selector) {
    const cleanSelector = selector.split(':')[0].trim();
    return cleanSelector === 'html' || cleanSelector === 'body';
}

function hasNestedTagSelector(selector) {
    // Сначала разбиваем по запятым (групповые селекторы)
    const selectorGroups = selector.split(',').map((s) => s.trim());

    return selectorGroups.some((group) => {
        // Разбиваем каждую группу на части (по пробелам, >, +, ~)
        const parts = group.split(/[\s>+~]+/).filter((part) => part.trim());

        if (parts.length <= 1) {
            return false; // Не каскадный селектор
        }

        // Проверяем, есть ли среди частей селектора теги (кроме разрешенных)
        return parts.some((part) => {
            return isTagSelector(part) && !isAllowedTag(part);
        });
    });
}

function isNestedInRule(rule) {
    // Проверяем, находится ли правило внутри другого правила (SCSS вложенность)
    let parent = rule.parent;
    while (parent) {
        if (parent.type === 'rule') {
            return true;
        }
        parent = parent.parent;
    }
    return false;
}

const plugin = stylelint.createPlugin(ruleName, (enabled) => {
    if (!enabled) {
        return (root, result) => {
            // Rule disabled
        };
    }

    return (root, result) => {
        root.walkRules((rule) => {
            // Проверяем два случая:
            // 1. Каскадный селектор с тегом (например: .class p)
            // 2. Тег, вложенный в SCSS (например: .popup { a { ... } })
            const isNestedTag = isTagSelector(rule.selector) && isNestedInRule(rule) && !isAllowedTag(rule.selector);
            const hasCascadeTag = hasNestedTagSelector(rule.selector);

            if (isNestedTag || hasCascadeTag) {
                stylelint.utils.report({
                    message: messages.rejected,
                    node: rule,
                    result,
                    ruleName,
                    severity: 'error',
                });
            }
        });
    };
});

plugin.ruleName = ruleName;
plugin.messages = messages;

export default plugin;
