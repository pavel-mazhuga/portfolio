import { TimestampQuery } from 'three/webgpu';
import BaseExperience from '../BaseExperience';
import Snowflakes from './Snowflakes';

class Demo extends BaseExperience {
    snowflakes: Snowflakes;
    maxCount = 10000;

    constructor(canvas: HTMLCanvasElement) {
        super(canvas);

        this.snowflakes = new Snowflakes({ amount: this.maxCount, renderer: this.renderer, viewport: this.viewport });
        this.scene.add(this.snowflakes);

        if (window.location.search.includes('debug')) {
            this.initTweakPane();
        }
    }

    async render() {
        this.snowflakes.update(this.delta);

        if (this.stats) {
            this.renderer.resolveTimestampsAsync(TimestampQuery.COMPUTE);
        }

        super.render();
    }

    destroy() {
        this.snowflakes.dispose();
        super.destroy();
    }

    initTweakPane() {
        super.initTweakPane();

        if (this.tweakPane) {
            this.snowflakes.initTweakPane(this.tweakPane);
        }
    }
}

export default Demo;
