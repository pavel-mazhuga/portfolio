export const withLeadingZero = /* @__PURE__ */ (num: number, targetLength = 2) => {
    return num.toString().padStart(targetLength, '0');
};

export const trimDecimal = /* @__PURE__ */ (number: number, targetLength = 1) => {
    return number.toFixed(targetLength).replace(/\.0$/, '');
};

export const deleteGetParams = /* @__PURE__ */ (str: string) =>
    str.indexOf('?') === -1 ? str : str.substring(0, str.indexOf('?'));

/**
 * Преобразует секунды в строку вида "mm:ss".
 */
export const formatTimeInSeconds = /* @__PURE__ */ (seconds: number, targetLength = 2) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds - minutes * 60;

    return isNaN(minutes) || isNaN(remainingSeconds)
        ? null
        : `${withLeadingZero(minutes, targetLength)}:${withLeadingZero(remainingSeconds, 2)}`;
};

/**
 * Форматирует номер телефона, оставляя только "+" и цифры, убирая все остальное
 */
export const formatPhoneHref = /* @__PURE__ */ (string: string) => string.replace(/[^\d+]/g, '');

export function bytesToSize(bytes: number): string {
    const sizes = ['bytes', 'kb', 'mb', 'gb', 'tb', 'pb', 'eb', 'zb', 'yb'];

    if (bytes === 0) return '0 bytes';

    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = (bytes / Math.pow(1024, i)).toFixed(sizes[i] === 'bytes' ? 0 : 2);

    return `${size} ${sizes[i]}`;
}
