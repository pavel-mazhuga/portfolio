import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import BloomNode, { bloom } from 'three/examples/jsm/tsl/display/BloomNode.js';
import { Fn, emissive, mrt, mx_fractal_noise_vec3, output, pass, screenUV, time, uniform, vec3, vec4 } from 'three/tsl';
import {
    MeshPhysicalNodeMaterial,
    PMREMGenerator,
    PostProcessing,
    SphereGeometry,
    Texture,
    TimestampQuery,
} from 'three/webgpu';
import BaseExperience from '../BaseExperience';
import { DissolveMesh } from './DissolveMesh';

class Dissolve extends BaseExperience {
    mesh: DissolveMesh;
    pmrem: PMREMGenerator;
    environmentTexture: Texture;
    postProcessing: PostProcessing;
    bloomPass: BloomNode;

    usePostprocessing = true;

    constructor(canvas: HTMLCanvasElement) {
        super(canvas);

        this.camera.position.set(0, 0, 5);

        this.scene.backgroundNode = Fn(() => {
            const color = vec3(mx_fractal_noise_vec3(vec3(screenUV, time.mul(0.3)))).toVar();
            color.mulAssign(0.1);

            return vec4(color, 1);
        })();

        this.pmrem = new PMREMGenerator(this.renderer);
        this.environmentTexture = this.pmrem.fromScene(new RoomEnvironment()).texture;
        this.scene.environment = this.environmentTexture;
        this.scene.environmentIntensity = 0.3;
        this.pmrem.dispose();

        const material = new MeshPhysicalNodeMaterial();

        this.mesh = new DissolveMesh(new SphereGeometry(1, 32, 32), material, {
            count: 15000,
            color: uniform(material.color),
            renderer: this.renderer,
        });
        this.scene.add(this.mesh);

        /**
         * Post processing
         */

        this.postProcessing = new PostProcessing(this.renderer);

        // Color
        const scenePass = pass(this.scene, this.camera);
        scenePass.setMRT(
            mrt({
                output,
                emissive,
            }),
        );
        const outputColor = scenePass.getTextureNode('output');
        const scenePassEmissive = scenePass.getTextureNode('emissive');

        // Bloom
        this.bloomPass = bloom(scenePassEmissive, 1.5, 0.2, 0.1);

        // Output
        this.postProcessing.outputNode = outputColor.add(this.bloomPass);

        /**
         * Tweak pane
         */

        this.initTweakPane();
    }

    async render() {
        if (this.stats) {
            this.renderer.resolveTimestampsAsync(TimestampQuery.COMPUTE);
        }

        super.render(this.usePostprocessing ? this.postProcessing : undefined);
    }

    destroy() {
        super.destroy();
        this.environmentTexture.dispose();
    }

    initTweakPane() {
        super.initTweakPane();

        if (this.tweakPane) {
            this.tweakPane.addBinding(this, 'usePostprocessing', {
                label: 'Postprocessing',
            });

            this.tweakPane.addBinding(this.bloomPass.strength, 'value', {
                min: 0,
                max: 3,
                step: 0.001,
                label: 'Bloom Strength',
            });

            this.tweakPane.addBinding(this.bloomPass.radius, 'value', {
                min: 0,
                max: 1,
                step: 0.001,
                label: 'Bloom Radius',
            });

            this.tweakPane.addBinding(this.bloomPass.threshold, 'value', {
                min: 0,
                max: 1,
                step: 0.001,
                label: 'Bloom Threshold',
            });

            this.tweakPane.addBinding(this.mesh.uniforms.progress, 'value', {
                min: 0,
                max: 1,
                step: 0.001,
                label: 'Progress',
            });

            this.tweakPane.addBinding(this.mesh.uniforms.edge, 'value', {
                min: 0,
                max: 0.25,
                step: 0.001,
                label: 'Edge',
            });

            this.tweakPane.addBinding(this.mesh.uniforms.frequency, 'value', {
                min: 0,
                max: 10,
                step: 0.001,
                label: 'Frequency',
            });

            const proxy = {
                color: '#00d4e8',
            };

            this.tweakPane
                .addBinding(proxy, 'color', {
                    label: 'Particles Color',
                })
                .on('change', (value) => {
                    this.mesh.uniforms.particles.color.value.set(value.value);
                });

            this.tweakPane.addBinding(this.mesh.uniforms.particles.size, 'value', {
                min: 0,
                max: 2,
                step: 0.001,
                label: 'Particles Size',
            });

            this.tweakPane.addBinding(this.mesh.uniforms.particles.speed, 'value', {
                min: 0,
                max: 0.01,
                step: 0.001,
                label: 'Particles Speed',
            });

            this.tweakPane.addBinding(this.mesh.uniforms.particles.decayFrequency, 'value', {
                min: 0,
                max: 2,
                step: 0.001,
                label: 'Particles Decay Frequency',
            });
        }
    }
}

export default Dissolve;
