import { RefObject, createRef, useRef } from 'react';

/**
 * Работает как `useRef`, только для группы элементов.
 * Используется в цикле рендеринга JSX.
 * 
 * Например:
 * 
 * ```jsx
 * const itemRefs = useMapRefs<HTMLDivElement>(someArray);
 * 
 * <div>
        {someArray.map((arrItem, i) => (
            <div ref={itemRefs.current[i]} key={i}>...</div>
        ))}
    </div>
 * ```
 */
export function useMapRefs<T = HTMLElement>(data: unknown[]) {
    const elements = useRef<RefObject<T>[]>([]);
    elements.current = data.map((_, i) => elements.current[i] ?? createRef());
    return elements;
}
