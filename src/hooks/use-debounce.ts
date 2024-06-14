import { useEffect, useState } from 'react';

export function useDebounce<T = any>(value: any, delay: number) {
    // Состояние и сеттер для отложенного значения
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(
        () => {
            // Выставить debouncedValue равным value (переданное значение)
            // после заданной задержки
            const handler = setTimeout(() => {
                setDebouncedValue(value);
            }, delay);

            // Вернуть функцию очистки, которая будет вызываться каждый раз, когда ...
            // ... useEffect вызван снова. useEffect будет вызван снова, только если ...
            // ... value будет изменено (смотри ниже массив зависимостей).
            // Так мы избегаем изменений debouncedValue, если значение value ...
            // ... поменялось в рамках интервала задержки.
            // Таймаут очищается и стартует снова.
            // Что бы сложить это воедино: если пользователь печатает что-то внутри ...
            // ... нашего приложения в поле поиска, мы не хотим, чтобы debouncedValue...
            // ... не менялось до тех пор, пока он не прекратит печатать дольше, чем {delay} ms.
            return () => {
                clearTimeout(handler);
            };
        },
        // Вызывается снова, только если значение изменится
        [value, delay],
    );

    return debouncedValue;
}
