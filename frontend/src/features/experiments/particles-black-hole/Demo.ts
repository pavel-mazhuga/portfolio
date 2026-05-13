import BloomNode, { bloom } from 'three/examples/jsm/tsl/display/BloomNode.js';
import { pass } from 'three/tsl';
import { DirectionalLight, RenderPipeline, TimestampQuery } from 'three/webgpu';
import BaseExperience from '../model/BaseExperience';
import BlackHole from './BlackHole';

class Demo extends BaseExperience {
    blackHole: BlackHole;
    private readonly dirLight: DirectionalLight;
    postProcessing: RenderPipeline;
    bloomPass: BloomNode;

    params = { usePostprocessing: true, bloomStrength: 0.7, bloomThreshold: 0.05, bloomRadius: 0.4 };

    constructor(canvas: HTMLCanvasElement) {
        super(canvas);
        this.camera.position.set(0, 0, 1);

        this.blackHole = new BlackHole({ amount: 10000, renderer: this.renderer, viewport: this.viewport });
        this.scene.add(this.blackHole);

        this.dirLight = new DirectionalLight(0xa72810, 0.6);
        this.dirLight.position.set(0, 0, 5);
        this.scene.add(this.dirLight);

        this.initTweakPane();

        /**
         * Post processing
         */
        this.postProcessing = new RenderPipeline(this.renderer);

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
        this.renderer.setAnimationLoop(null);

        this.scene.remove(this.blackHole);
        this.blackHole.dispose();

        this.scene.remove(this.dirLight);
        this.dirLight.dispose();

        this.bloomPass.dispose();
        this.postProcessing.dispose();

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
