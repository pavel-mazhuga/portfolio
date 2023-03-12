export class PausableTimer {
    remaining: number;
    callback: () => void;
    timerId?: NodeJS.Timer;
    start: number;

    constructor(callback: () => void, delay = 0) {
        this._onVisibilityChange = this._onVisibilityChange.bind(this);

        this.remaining = delay;
        this.callback = callback;
        this.timerId = undefined;
        this.start = 0;
        this.resume();
        document.addEventListener('visibilitychange', this._onVisibilityChange);
    }

    pause() {
        if (this.timerId) {
            clearTimeout(this.timerId);
            this.timerId = undefined;
        }

        this.remaining -= Date.now() - this.start;
    }

    resume() {
        if (this.timerId) {
            return;
        }

        this.start = Date.now();
        this.timerId = setTimeout(() => {
            this.clear();
            this.callback();
        }, this.remaining);
    }

    clear() {
        document.removeEventListener('visibilitychange', this._onVisibilityChange);
        clearTimeout(this.timerId);
    }

    _onVisibilityChange() {
        if (document.hidden) {
            this.pause();
        } else {
            this.resume();
        }
    }
}
