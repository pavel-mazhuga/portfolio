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
