import { Mesh, MeshBasicMaterial, PlaneGeometry, TimestampQuery } from 'three/webgpu';
import BaseExperience from '../BaseExperience';

class Demo extends BaseExperience {
    params = {};

    constructor(canvas: HTMLCanvasElement) {
        super(canvas);
        this.camera.position.set(0, 0, 5);

        const mesh = new Mesh(new PlaneGeometry(1, 1), new MeshBasicMaterial({ color: 0x00ff00 }));
        this.scene.add(mesh);

        this.initTweakPane();
    }

    async render() {
        if (this.stats) {
            this.renderer.resolveTimestampsAsync(TimestampQuery.COMPUTE);
        }

        super.render();
    }

    destroy() {
        super.destroy();
    }

    initTweakPane() {
        super.initTweakPane();

        if (this.tweakPane) {
            //
        }
    }
}

export default Demo;
