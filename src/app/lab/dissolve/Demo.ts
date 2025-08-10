import { Discard, Fn, If, positionLocal, select, uniform, vec3, vec4 } from 'three/tsl';
import { Color, Mesh, MeshBasicNodeMaterial, PlaneGeometry, TimestampQuery } from 'three/webgpu';
import { simplexNoise3d } from '@/utils/webgpu/nodes/noise/simplexNoise3d';
import BaseExperience from '../BaseExperience';

class Dissolve extends BaseExperience {
    uniforms = {
        progress: uniform(0),
        edge: uniform(0.03),
        edgeColor: uniform(new Color('#fff')),
        frequency: uniform(1),
        amplitude: uniform(1),
    };

    constructor(canvas: HTMLCanvasElement) {
        super(canvas);
        this.camera.position.set(0, 0, 5);

        const material = new MeshBasicNodeMaterial({ color: 0x00ff00 });

        const getNoise = Fn(() => {
            const { frequency, amplitude } = this.uniforms;
            return simplexNoise3d(positionLocal.mul(frequency)).mul(amplitude);
        });

        material.colorNode = Fn(() => {
            const { progress, edge, edgeColor } = this.uniforms;
            const mappedProgress = progress.remap(0, 1, -0.3, 0.7).toVar('mappedProgress');
            const noise = getNoise();
            const edgeWidth = mappedProgress.add(edge).toVar('edgeWidth');

            Discard(noise.lessThan(mappedProgress));

            return select(
                noise.greaterThan(mappedProgress).and(noise.lessThan(edgeWidth)),
                vec4(edgeColor, noise),
                vec4(material.color, 1),
            );
        })();

        const mesh = new Mesh(new PlaneGeometry(1, 1), material);
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
            this.tweakPane.addBinding(this.uniforms.progress, 'value', {
                min: 0,
                max: 1,
                step: 0.001,
                label: 'Progress',
            });

            this.tweakPane.addBinding(this.uniforms.edge, 'value', {
                min: 0,
                max: 0.06,
                step: 0.001,
                label: 'Edge',
            });

            this.tweakPane.addBinding(this.uniforms.edgeColor, 'value', {
                label: 'Edge Color',
            });

            this.tweakPane.addBinding(this.uniforms.frequency, 'value', {
                min: 0,
                max: 10,
                step: 0.001,
                label: 'Frequency',
            });

            this.tweakPane.addBinding(this.uniforms.amplitude, 'value', {
                min: 0,
                max: 10,
                step: 0.001,
                label: 'Amplitude',
            });
        }
    }
}

export default Dissolve;
