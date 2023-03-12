export const mockVideo = () => {
    Object.defineProperty(HTMLMediaElement.prototype, 'play', {
        configurable: true,
        value: jest.fn(),
    });
    Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
        configurable: true,
        value: jest.fn(),
    });
};
