import Typograf from 'typograf';
import { DEFAULT_LOCALE } from '@/shared/config/i18n';

Typograf.addRule({
    name: 'common/other/aposToQuot',
    handler: function (text) {
        return text.replace(/&apos;/g, "'");
    },
});

const typograf = new Typograf({ locale: ['ru', 'en-US'] });

typograf.enableRule(['common/nbsp/afterNumber']);

// Вложенные кавычки тоже «ёлочки» для русской типографики
typograf.setSetting('common/punctuation/quote', 'ru', { left: '«', right: '»', removeDuplicateQuotes: true });

const cache = new Map<string, string>();

export const tp = (str: string, locale = DEFAULT_LOCALE) => {
    const key = `${locale}___${str}`;

    if (cache.has(key)) {
        return cache.get(key)!;
    }

    const result = typograf.execute(str, { locale: 'en-US' });

    cache.set(key, result);

    return result;
};
