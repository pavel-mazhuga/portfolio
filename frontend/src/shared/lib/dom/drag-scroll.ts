function init(container: Element | Document = document) {
    const scrollElements = container.querySelectorAll('.js-drag-scroll');

    scrollElements.forEach((element) => {
        let isDragging = false;
        let startX = 0;
        let scrollLeft = 0;

        const handleMouseDown = (e: Event) => {
            const mouseEvent = e as MouseEvent;

            isDragging = true;
            startX = mouseEvent.pageX - (element as HTMLElement).offsetLeft;
            scrollLeft = element.scrollLeft;
            (element as HTMLElement).style.cursor = 'grabbing';
            mouseEvent.preventDefault();
        };

        const handleMouseMove = (e: Event) => {
            const mouseEvent = e as MouseEvent;

            if (!isDragging) return;

            const x = mouseEvent.pageX - (element as HTMLElement).offsetLeft;

            const walkX = (x - startX) * 1.5;

            element.scrollLeft = scrollLeft - walkX;
        };

        const handleMouseUp = () => {
            isDragging = false;
            (element as HTMLElement).style.cursor = 'grab';
        };

        element.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        (element as any)._dragScrollHandlers = {
            mousedown: handleMouseDown,
            mousemove: handleMouseMove,
            mouseup: handleMouseUp,
        };
    });
}

function destroy() {
    const scrollElements = document.querySelectorAll('.js-drag-scroll');

    scrollElements.forEach((element) => {
        const handlers = (element as any)._dragScrollHandlers;

        if (handlers) {
            element.removeEventListener('mousedown', handlers.mousedown);
            document.removeEventListener('mousemove', handlers.mousemove);
            document.removeEventListener('mouseup', handlers.mouseup);
            delete (element as any)._dragScrollHandlers;
        }
    });
}

const _module = { init, destroy };

export default _module;
