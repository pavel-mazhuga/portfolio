import { TimestampQuery } from 'three/webgpu';
import BaseExperience from '../BaseExperience';
import Snowflakes from './Snowflakes';

class Demo extends BaseExperience {
    snowflakes: Snowflakes;

    constructor(canvas: HTMLCanvasElement) {
        super(canvas);
        this.camera.position.set(0, 0, 1);

        this.snowflakes = new Snowflakes({
            amount: 5000,
            renderer: this.renderer,
            viewport: this.viewport,
        });
        this.scene.add(this.snowflakes);

        // if (window.location.search.includes('debug')) {
        this.initTweakPane();
        // }
    }

    async render() {
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
