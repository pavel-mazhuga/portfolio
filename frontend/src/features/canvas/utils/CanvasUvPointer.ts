import { Vector2 } from 'three/webgpu';

export class CanvasUvPointer {
    readonly uv = new Vector2();

    private readonly canvas: HTMLCanvasElement;
    private left = 0;
    private top = 0;
    private width = 1;
    private height = 1;

    private readonly onLayoutChange = () => {
        this.updateRect();
    };

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.updateRect();
        window.addEventListener('resize', this.onLayoutChange);
        window.addEventListener('scroll', this.onLayoutChange, { passive: true });
    }

    updateRect() {
        const rect = this.canvas.getBoundingClientRect();

        this.left = rect.left;
        this.top = rect.top;
        this.width = rect.width || 1;
        this.height = rect.height || 1;
    }

    setFromClient(clientX: number, clientY: number, target = this.uv) {
        target.set((clientX - this.left) / this.width, (clientY - this.top) / this.height);

        return target;
    }

    setFromEvent(event: PointerEvent, target = this.uv) {
        return this.setFromClient(event.clientX, event.clientY, target);
    }

    setNdcFromClient(clientX: number, clientY: number, target: Vector2) {
        this.setFromClient(clientX, clientY);

        return target.set(this.uv.x * 2 - 1, -(this.uv.y * 2 - 1));
    }

    setNdcFromEvent(event: PointerEvent, target: Vector2) {
        return this.setNdcFromClient(event.clientX, event.clientY, target);
    }

    dispose() {
        window.removeEventListener('resize', this.onLayoutChange);
        window.removeEventListener('scroll', this.onLayoutChange);
    }
}
