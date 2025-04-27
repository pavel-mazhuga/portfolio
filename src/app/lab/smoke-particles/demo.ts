import { TimestampQuery } from 'three/webgpu';
import BaseExperience from '../BaseExperience';
import ParticlesMesh from './ParticlesMesh';

class Demo extends BaseExperience {
    mesh: ParticlesMesh;
    maxCount = 10000;

    constructor(canvas: HTMLCanvasElement) {
        super(canvas);

        this.mesh = new ParticlesMesh({ amount: this.maxCount, renderer: this.renderer });
        this.scene.add(this.mesh);

        if (window.location.search.includes('debug')) {
            this.initTweakPane();
        }
    }

    async render() {
        this.mesh.update(this.delta);

        if (this.stats) {
            this.renderer.resolveTimestampsAsync(TimestampQuery.COMPUTE);
        }

        super.render();
    }

    destroy() {
        this.mesh.dispose();
        super.destroy();
    }

    initTweakPane() {
        super.initTweakPane();

        if (this.tweakPane) {
            this.mesh.initTweakPane(this.tweakPane);
        }
    }
}

export default Demo;
