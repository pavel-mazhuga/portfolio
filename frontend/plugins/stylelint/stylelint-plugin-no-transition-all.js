import stylelint from 'stylelint';

// Новое правило для запрета transition: all
const ruleName = 'custom/no-transition-all';
const messages = stylelint.utils.ruleMessages(ruleName, {
    rejected: 'transition: all запрещено, используйте конкретные свойства',
});

function createTransitionAllRule(enabled) {
    if (!enabled) {
        return (root, result) => {
            // Rule disabled
        };
    }

    return (root, result) => {
        root.walkDecls('transition', (decl) => {
            if (decl.value && /\ball\b/.test(decl.value)) {
                stylelint.utils.report({
                    message: messages.rejected,
                    node: decl,
                    result,
                    ruleName,
                    severity: 'error',
                });
            }
        });
    };
}

const plugin = stylelint.createPlugin(ruleName, createTransitionAllRule);
plugin.ruleName = ruleName;
plugin.messages = messages;

export default plugin;
