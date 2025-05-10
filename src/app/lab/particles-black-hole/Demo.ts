import { DirectionalLight, TimestampQuery } from 'three/webgpu';
import BaseExperience from '../BaseExperience';
import Substance from './Substance';

class Demo extends BaseExperience {
    substance: Substance;

    constructor(canvas: HTMLCanvasElement) {
        super(canvas);
        this.camera.position.set(0, 0, 1);

        this.substance = new Substance({ amount: 10000, renderer: this.renderer, viewport: this.viewport });
        this.scene.add(this.substance);

        const dirLight = new DirectionalLight(0xa72810, 0.6);
        dirLight.position.set(0, 0, 5);
        this.scene.add(dirLight);

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
        this.substance.dispose();
        super.destroy();
    }

    initTweakPane() {
        super.initTweakPane();

        if (this.tweakPane) {
            this.substance.initTweakPane(this.tweakPane);
        }
    }
}

export default Demo;
