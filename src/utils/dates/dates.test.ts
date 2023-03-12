import { formatDate } from '.';

describe('dates', () => {
    test('formatDate', () => {
        expect(formatDate(new Date('2023/05/02'))).toBe('02.05.2023');
    });
});
