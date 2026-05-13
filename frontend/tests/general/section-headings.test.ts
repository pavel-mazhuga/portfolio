import { expect, testAllPages } from '../utils';

testAllPages('Section headings', async (page) => {
    const sections = page.locator('section');
    const sectionCount = await sections.count();

    for (let i = 0; i < sectionCount; i++) {
        const section = sections.nth(i);
        const headings = section.locator('h1, h2, h3, h4, h5, h6');
        const headingCount = await headings.count();

        if (headingCount === 0) {
            const sectionOuterHTML = await section.evaluate((el) => el.outerHTML);
            const pageHTML = await page.content();
            const sectionStartIndex = pageHTML.indexOf(sectionOuterHTML);
            const lineNumber = pageHTML.substring(0, sectionStartIndex).split('\n').length;

            const errorMessage = `Section ${i + 1} should contain at least one heading (h1-h6).
Line ${lineNumber} in HTML:

${sectionOuterHTML}`;

            await expect(headingCount, errorMessage).toBeGreaterThan(0);
        }
    }
});
