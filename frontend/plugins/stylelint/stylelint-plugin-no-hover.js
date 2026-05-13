import stylelint from 'stylelint';

const ruleName = 'custom/no-hover';
const messages = stylelint.utils.ruleMessages(ruleName, {
    rejected:
        'Использование псевдокласса ":hover" приводит к залипанию на touch-устройствах. Рекомендуется использовать миксин "@include hover() { ... }".',
});

function isHoverMediaQuery(node) {
    if (node.type !== 'atrule' || node.name !== 'media') {
        return false;
    }

    const params = node.params.toLowerCase();
    return (
        params.includes('any-hover: hover') ||
        params.includes('hover: hover') ||
        (params.includes('hover: hover') && params.includes('pointer: fine'))
    );
}

function findParentHoverMediaQuery(node) {
    let parent = node.parent;
    while (parent) {
        if (isHoverMediaQuery(parent)) {
            return parent;
        }
        parent = parent.parent;
    }
    return null;
}

const plugin = stylelint.createPlugin(ruleName, (enabled) => {
    if (!enabled) {
        return (root, result) => {
            // Rule disabled
        };
    }

    return (root, result) => {
        root.walkRules((rule) => {
            if (rule.selector && rule.selector.includes(':hover')) {
                // Проверяем, находится ли правило внутри медиазапроса для hover устройств
                const parentHoverMedia = findParentHoverMediaQuery(rule);
                if (parentHoverMedia) {
                    return; // Игнорируем, если внутри hover медиазапроса
                }

                stylelint.utils.report({
                    message: messages.rejected,
                    node: rule,
                    result,
                    ruleName,
                    severity: 'warning',
                });
            }
        });
    };
});

plugin.ruleName = ruleName;
plugin.messages = messages;

export default plugin;
