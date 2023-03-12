const locale = 'ru';

/**
 * Конвертирует число в строку типа "валюта"
 *
 * @param  {number} number - число, которое нужно сконвертировать
 * @param  {string} currency - валюта. Например, 'RUB'
 * @returns {string}
 */
export const toCurrency = (number: number, currency = 'RUB', minDigits = 0, maxDigits = 0) =>
    number.toLocaleString(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: minDigits,
        maximumFractionDigits: maxDigits,
    });
