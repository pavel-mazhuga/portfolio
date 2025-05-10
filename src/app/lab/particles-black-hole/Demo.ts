import BloomNode, { bloom } from 'three/examples/jsm/tsl/display/BloomNode.js';
import { ShaderNodeObject, pass } from 'three/tsl';
import { DirectionalLight, PostProcessing, TimestampQuery } from 'three/webgpu';
import BaseExperience from '../BaseExperience';
import BlackHole from './BlackHole';

class Demo extends BaseExperience {
    blackHole: BlackHole;
    postProcessing: PostProcessing;
    bloomPass: ShaderNodeObject<BloomNode>;

    params = { usePostprocessing: true, bloomStrength: 0.7, bloomThreshold: 0.05, bloomRadius: 0.4 };

    constructor(canvas: HTMLCanvasElement) {
        super(canvas);
        this.camera.position.set(0, 0, 1);

        this.blackHole = new BlackHole({ amount: 10000, renderer: this.renderer, viewport: this.viewport });
        this.scene.add(this.blackHole);

        const dirLight = new DirectionalLight(0xa72810, 0.6);
        dirLight.position.set(0, 0, 5);
        this.scene.add(dirLight);

        // if (window.location.search.includes('debug')) {
        this.initTweakPane();
        // }

        /**
         * Post processing
         */
        this.postProcessing = new PostProcessing(this.renderer);

        // Color
        const scenePass = pass(this.scene, this.camera);
        // Bloom
        this.bloomPass = bloom(
            scenePass,
            this.params.bloomStrength,
            this.params.bloomThreshold,
            this.params.bloomRadius,
        );
        // Output
        this.postProcessing.outputNode = scenePass.add(this.bloomPass);
    }

    async render() {
        if (this.stats) {
            this.renderer.resolveTimestampsAsync(TimestampQuery.COMPUTE);
        }

        super.render(this.params.usePostprocessing ? this.postProcessing : undefined);
    }

    destroy() {
        this.blackHole.dispose();
        super.destroy();
    }

    initTweakPane() {
        super.initTweakPane();

        if (this.tweakPane) {
            this.blackHole.initTweakPane(this.tweakPane);

            const postProcessingFolder = this.tweakPane.addFolder({ title: 'Postprocessing' });
            postProcessingFolder.addBinding(this.params, 'usePostprocessing');
            postProcessingFolder
                .addBinding(this.params, 'bloomStrength', { min: 0, max: 1, step: 0.001 })
                .on('change', () => {
                    this.bloomPass.strength.value = this.params.bloomStrength;
                });
            postProcessingFolder
                .addBinding(this.params, 'bloomThreshold', { min: 0, max: 1, step: 0.001 })
                .on('change', () => {
                    this.bloomPass.threshold.value = this.params.bloomThreshold;
                });
            postProcessingFolder
                .addBinding(this.params, 'bloomRadius', { min: 0, max: 1, step: 0.001 })
                .on('change', () => {
                    this.bloomPass.radius.value = this.params.bloomRadius;
                });
        }
    }
}

export default Demo;
