import type { LOCALES } from './const';

export type AppLocale = (typeof LOCALES)[number];

export type DictValue = Record<AppLocale, string>;
