/**
 * ESLint правило для Feature-Sliced Design архитектуры
 * Запрещает импорт из слоев ниже текущего слоя
 *
 * Слои FSD в порядке приоритета (от высшего к низшему):
 * app > processes > pages > widgets > features > entities > shared
 */

const FSD_LAYERS = ['app', 'processes', 'pages', 'widgets', 'features', 'entities', 'shared'];

/**
 * Получить индекс слоя в иерархии FSD
 * @param {string} layer - название слоя
 * @returns {number} индекс слоя (меньше = выше в иерархии)
 */
function getLayerIndex(layer) {
    return FSD_LAYERS.indexOf(layer);
}

/**
 * Извлечь слой из пути файла
 * @param {string} filePath - путь к файлу
 * @returns {string|null} название слоя или null если не найден
 */
function extractLayerFromPath(filePath) {
    // Удаляем абсолютные пути и алиасы
    const normalizedPath = filePath.replace(/^@\/|^~\/|^\.\.\//, '').replace(/^src\//, '');

    // Ищем первый сегмент пути, который соответствует слою FSD
    const pathSegments = normalizedPath.split('/');

    for (const segment of pathSegments) {
        if (FSD_LAYERS.includes(segment)) {
            return segment;
        }
    }

    return null;
}

/**
 * Извлечь слой из импорта
 * @param {string} importPath - путь импорта
 * @returns {string|null} название слоя или null если не найден
 */
function extractLayerFromImport(importPath) {
    // Обрабатываем относительные импорты
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
        return null; // Относительные импорты не проверяем
    }

    // Удаляем алиасы
    const normalizedPath = importPath.replace(/^@\/|^~\/|^\.\.\//, '').replace(/^src\//, '');

    const pathSegments = normalizedPath.split('/');

    for (const segment of pathSegments) {
        if (FSD_LAYERS.includes(segment)) {
            return segment;
        }
    }

    return null;
}

export default {
    meta: {
        type: 'problem',
        docs: {
            description: 'Запрещает импорт из слоев ниже текущего в FSD архитектуре',
            category: 'Best Practices',
            recommended: true,
        },
        fixable: null,
        schema: [],
        messages: {
            invalidImport:
                'Слой "{{currentLayer}}" не может импортировать из слоя "{{importLayer}}" (нарушение FSD архитектуры)',
            relativeImport: 'Относительные импорты не проверяются этим правилом',
        },
    },

    create(context) {
        const filePath = context.getFilename();
        const currentLayer = extractLayerFromPath(filePath);

        // Если не удалось определить слой текущего файла, пропускаем
        if (!currentLayer) {
            return {};
        }

        const currentLayerIndex = getLayerIndex(currentLayer);

        return {
            ImportDeclaration(node) {
                const importPath = node.source.value;
                const importLayer = extractLayerFromImport(importPath);

                // Пропускаем если не удалось определить слой импорта
                if (!importLayer) {
                    return;
                }

                const importLayerIndex = getLayerIndex(importLayer);

                // Проверяем правило: слой может импортировать только из слоев ниже или равных по иерархии
                // (меньший индекс = выше в иерархии, больший индекс = ниже в иерархии)
                if (importLayerIndex < currentLayerIndex) {
                    context.report({
                        node: node.source,
                        messageId: 'invalidImport',
                        data: {
                            currentLayer,
                            importLayer,
                        },
                    });
                }
            },

            ImportExpression(node) {
                // Обрабатываем динамические импорты
                if (node.source.type === 'Literal') {
                    const importPath = node.source.value;
                    const importLayer = extractLayerFromImport(importPath);

                    if (!importLayer) {
                        return;
                    }

                    const importLayerIndex = getLayerIndex(importLayer);

                    if (importLayerIndex < currentLayerIndex) {
                        context.report({
                            node: node.source,
                            messageId: 'invalidImport',
                            data: {
                                currentLayer,
                                importLayer,
                            },
                        });
                    }
                }
            },
        };
    },
};
