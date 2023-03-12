import getNoun from '.';

test('getNoun', () => {
    expect(getNoun(1, 'свеча', 'свечи', 'свечей')).toBe('свеча');
    expect(getNoun(3, 'свеча', 'свечи', 'свечей')).toBe('свечи');
    expect(getNoun(9, 'свеча', 'свечи', 'свечей')).toBe('свечей');
    expect(getNoun(11, 'свеча', 'свечи', 'свечей')).toBe('свечей');
});
