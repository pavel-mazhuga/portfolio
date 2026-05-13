/**
 * Любой `set:html` в Astro должен идти через DOMPurify.sanitize(...)
 * @fileoverview Снижает XSS при вставке HTML из строк, слотов и JSON-LD
 */

function isDomPurifySanitizeCall(node) {
    return (
        node &&
        node.type === 'CallExpression' &&
        node.callee?.type === 'MemberExpression' &&
        node.callee.object?.type === 'Identifier' &&
        node.callee.object.name === 'DOMPurify' &&
        node.callee.property?.type === 'Identifier' &&
        node.callee.property.name === 'sanitize'
    );
}

export default {
    meta: {
        type: 'problem',
        docs: {
            description: 'require DOMPurify.sanitize() for every Astro set:html directive',
            category: 'Security',
            recommended: true,
        },
        schema: [],
        messages: {
            unsafeSetHtml:
                'Небезопасная вставка HTML: используйте DOMPurify.sanitize(...) в выражении set:html для снижения риска XSS.',
        },
    },

    create(context) {
        return {
            JSXOpeningElement(node) {
                for (const attr of node.attributes) {
                    if (attr.type !== 'JSXAttribute') {
                        continue;
                    }
                    const { name } = attr;

                    if (
                        name?.type !== 'JSXNamespacedName' ||
                        name.namespace?.name !== 'set' ||
                        name.name?.name !== 'html'
                    ) {
                        continue;
                    }

                    const expr = attr.value?.type === 'JSXExpressionContainer' ? attr.value.expression : null;

                    if (!isDomPurifySanitizeCall(expr)) {
                        context.report({
                            node: attr,
                            messageId: 'unsafeSetHtml',
                        });
                    }
                }
            },
        };
    },
};
