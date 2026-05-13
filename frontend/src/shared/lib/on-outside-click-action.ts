/**
 * Утилита для обработки кликов вне элемента
 *
 * @param elements - Элемент или массив элементов для проверки
 * @param callback - Функция, которая выполняется при клике вне элемента
 * @returns Функция для удаления обработчика событий
 *
 * @example
 * const cleanup = onOutsideClickAction(element, () => {
 *   console.log('Клик вне элемента');
 * });
 *
 * // Удалить обработчик
 * cleanup();
 */
export function onOutsideClickAction(elements: Element | Element[] | null, callback: () => void): () => void {
    const closeOnOutsideClick = (event: Event) => {
        const target = event.target as HTMLElement;
        const elementsList = Array.isArray(elements) ? elements : [elements];

        if (elementsList.every((el) => el && !el.contains(target))) {
            callback();
        }
    };

    document.documentElement.addEventListener('click', closeOnOutsideClick);

    return () => document.documentElement.removeEventListener('click', closeOnOutsideClick);
}
