export function withLeadingZero(num: number, targetLength = 2) {
    return num.toString().padStart(targetLength, '0');
}

export function trimDecimal(number: number, targetLength = 1) {
    return number.toFixed(targetLength).replace(/\.0$/, '');
}

export const deleteGetParams = (str: string) => (str.indexOf('?') === -1 ? str : str.substring(0, str.indexOf('?')));

/**
 * Преобразует секунды в строку вида "mm:ss".
 */
export const formatTimeInSeconds = (seconds: number, targetLength = 2) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds - minutes * 60;

    return isNaN(minutes) || isNaN(remainingSeconds)
        ? null
        : `${withLeadingZero(minutes, targetLength)}:${withLeadingZero(remainingSeconds, 2)}`;
};

/**
 * Генерирует slug из строки
 *
 * @param text
 * @returns {String}
 */
export const slugify = (text: string) => {
    const cyrillicToLatinMap: Record<string, string> = {
        а: 'a',
        б: 'b',
        в: 'v',
        г: 'g',
        д: 'd',
        е: 'e',
        ё: 'yo',
        ж: 'zh',
        з: 'z',
        и: 'i',
        й: 'y',
        к: 'k',
        л: 'l',
        м: 'm',
        н: 'n',
        о: 'o',
        п: 'p',
        р: 'r',
        с: 's',
        т: 't',
        у: 'u',
        ф: 'f',
        х: 'h',
        ц: 'c',
        ч: 'ch',
        ш: 'sh',
        щ: 'sch',
        ъ: '',
        ы: 'y',
        ь: '',
        э: 'e',
        ю: 'yu',
        я: 'ya',
    };

    return text
        .toString() // Cast to string (optional)
        .normalize('NFKD') // The normalize() using NFKD method returns the Unicode Normalization Form of a given string.
        .toLowerCase() // Convert the string to lowercase letters
        .trim() // Remove whitespace from both sides of a string (optional)
        .replace(/[а-яё]/g, (char) => cyrillicToLatinMap[char] || char)
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(/[^\w\-]+/g, '') // Remove all non-word chars
        .replace(/\_/g, '-') // Replace _ with -
        .replace(/\-\-+/g, '-') // Replace multiple - with single -
        .replace(/\-$/g, ''); // Remove trailing -
};
