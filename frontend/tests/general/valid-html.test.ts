import validator from 'html-validator';
import { expect, testAllPages } from '../utils';

testAllPages('Valid HTML', async (page) => {
    const html = await page.content();
    const result = (await validator({
        data: html,
        ignore: [
            'CSS: Parse Error.',
            'Error: Element “style” not allowed as child of element “div” in this context. (Suppressing further errors from this subtree.)',
        ],
    })) as any as string;
    const errors =
        result === 'The document validates according to the specified schema(s).'
            ? []
            : result
                  .replace('There were errors.', '')
                  .trim()
                  .split('Error:')
                  .filter((str) => !(str === '' || /CSS\:/.test(str)))
                  .map((str) => `Error: ${str}`);

    expect(errors.length, errors.join('\n')).toEqual(0);
});
