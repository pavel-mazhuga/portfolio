import Typograf from 'typograf';

const typograf = new Typograf({ locale: ['en-US'] });

export const tp = (text: string) => typograf.execute(text);
