import { test, expect } from '@playwright/test';
import validator from 'html-validator';
import { pages } from '../../playwright.config.common';

test.describe('Valid HTML', () => {
    pages.forEach((url) => {
        test(url, async ({ baseURL }) => {
            const result = (await validator({
                url: baseURL + url,
                ignore: [
                    'Error: Element “source” is missing required attribute “srcset”.',
                    'Error: Element “img” is missing required attribute “src”.',
                    'Error: Bad value “” for attribute “src” on element “img”: Must be non-empty.',
                ],
            })) as any as string;
            const errors =
                result ===
                'The document validates according to the specified schema(s).'
                    ? []
                    : result
                          .replace('There were errors.', '')
                          .trim()
                          .split('Error:')
                          .filter(
                              (str) =>
                                  !(
                                      str === '' ||
                                      /CSS: “--(.*): Parse Error/.test(str)
                                  ),
                          )
                          .map((str) => `Error: ${str}`);

            expect(errors.length, errors.join('\n')).toEqual(0);
        });
    });
});
