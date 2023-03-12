export const mockLocalStorage = () =>
    Object.defineProperty(global, 'localStorage', {
        writable: true,
        value: {
            getItem: jest.fn(),
            setItem: jest.fn(),
            removeItem: jest.fn(),
            clear: jest.fn(),
            key: (index: number) => null,
            length: 0,
        },
    });
