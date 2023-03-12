const isServer = typeof window === 'undefined';

export const viewport = {
    width: isServer ? 0 : window.innerWidth,
    height: isServer ? 0 : window.innerHeight,
};

if (!isServer) {
    window.addEventListener('resize', () => {
        viewport.width = window.innerWidth;
        viewport.height = window.innerHeight;
    });
}
