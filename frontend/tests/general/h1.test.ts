import { expect, testAllPages } from '../utils';

testAllPages('h1', async (page) => {
    const h1 = page.locator('h1');
    const count = await h1.count();
    await expect(count).toEqual(1);
});
