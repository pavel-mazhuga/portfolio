export const calculateScrollbarWidth = () => {
    const CONTAINER_WIDTH = 100;

    const scrollbarWidthOuter = document.createElement('div');
    scrollbarWidthOuter.className = 'styled-scrollbar';
    scrollbarWidthOuter.id = 'scrollbar-width--outer';
    scrollbarWidthOuter.style.cssText = `
        z-index: -9999;
        position: absolute;
        visibility: hidden;
        width: ${CONTAINER_WIDTH}px;
        margin-left: -${CONTAINER_WIDTH}px;
        overflow: scroll;
    `;

    document.body.appendChild(scrollbarWidthOuter);

    const scrollbarWidthInner = document.createElement('div');
    scrollbarWidthInner.id = 'scrollbar-width--inner';
    scrollbarWidthInner.style.width = `${CONTAINER_WIDTH}%`;

    scrollbarWidthOuter.appendChild(scrollbarWidthInner);

    let scrollbarWidthLast = 0;

    const calculateScrollbarWidth = () => {
        const scrollbarWidth = CONTAINER_WIDTH - scrollbarWidthInner.offsetWidth;
        if (scrollbarWidthLast !== scrollbarWidth) {
            document.documentElement.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`);
            scrollbarWidthLast = scrollbarWidth;
        }
    };
    if (typeof window !== 'undefined') {
        window.addEventListener('resize', calculateScrollbarWidth);
    }
    calculateScrollbarWidth();

    return () => {
        if (typeof window !== 'undefined') {
            window.removeEventListener('resize', calculateScrollbarWidth);
        }
        document.body.removeChild(scrollbarWidthOuter);
    };
};
