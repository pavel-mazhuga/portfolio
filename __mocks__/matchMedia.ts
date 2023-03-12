export const mockMatchMedia = (matchesValue = false) =>
    Object.defineProperty(global, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation((query) => ({
            matches: matchesValue,
            media: query,
            onchange: null,
            addListener: jest.fn(),
            removeListener: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
        })),
    });
