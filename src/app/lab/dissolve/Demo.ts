import { animate } from 'framer-motion';
import { Clock } from 'three';
import { fxaa } from 'three/addons/tsl/display/FXAANode.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import BloomNode, { bloom } from 'three/examples/jsm/tsl/display/BloomNode.js';
import {
    Fn,
    emissive,
    mrt,
    mx_fractal_noise_vec3,
    output,
    pass,
    renderOutput,
    screenUV,
    time,
    uniform,
    vec3,
    vec4,
} from 'three/tsl';
import { DirectionalLight, MeshPhysicalNodeMaterial, PointLight, PostProcessing, TimestampQuery } from 'three/webgpu';
import { easeInOutCubic } from '@/easings';
import BaseExperience from '../BaseExperience';
import { DissolveMesh } from './DissolveMesh';

class Dissolve extends BaseExperience {
    mesh?: DissolveMesh;
    postProcessing: PostProcessing;
    bloomPass: BloomNode;
    controls: OrbitControls;
    pointLight1: PointLight;
    pointLight2: PointLight;
    clock = new Clock();

    usePostprocessing = true;

    progressButton?: any;
    isVisible = true;
    animateProgress = () => {};
    handleKeydown = (event: KeyboardEvent) => {};

    constructor(canvas: HTMLCanvasElement) {
        super(canvas);

        this.controls = new OrbitControls(this.camera, this.canvas);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        this.scene.backgroundNode = Fn(() => {
            const color = vec3(mx_fractal_noise_vec3(vec3(screenUV, time.mul(0.3)))).toVar();
            color.mulAssign(0.05);

            return vec4(color, 1);
        })();

        const directionalLight = new DirectionalLight(0xffffff, 1.4);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);

        // Point lights flying in figure-8 pattern
        this.pointLight1 = new PointLight(0xff6b6b, 1.5, 10);
        this.pointLight2 = new PointLight(0x4ecdc4, 1.5, 10);
        this.scene.add(this.pointLight1);
        this.scene.add(this.pointLight2);

        const material = new MeshPhysicalNodeMaterial({
            roughness: 0.2,
            metalness: 0.9,
        });

        const loader = new GLTFLoader();
        loader.load(
            '/gltf/suzanne.glb',
            (gltf) => {
                const suzanne = gltf.scene;
                const suzanneMesh = suzanne.children[0] as any;
                suzanneMesh.scale.setScalar(0.5);

                this.mesh = new DissolveMesh(suzanneMesh.geometry, material, {
                    count: 25000,
                    color: uniform(material.color),
                    renderer: this.renderer,
                });
                this.scene.add(this.mesh);

                /**
                 * Tweak pane
                 */

                this.initTweakPane();
            },
            undefined,
            (error) => {
                console.error('Ошибка загрузки suzanne.glb:', error);
            },
        );

        /**
         * Post processing
         */

        this.postProcessing = new PostProcessing(this.renderer);
        // ignore default output color transform ( toneMapping and outputColorSpace )
        // use renderOutput() for control the sequence
        this.postProcessing.outputColorTransform = false;

        // Color
        const scenePass = pass(this.scene, this.camera);
        scenePass.setMRT(
            mrt({
                output,
                emissive,
            }),
        );

        const outputPass = renderOutput(scenePass);
        const fxaaPass = fxaa(outputPass);
        const scenePassEmissive = scenePass.getTextureNode('emissive');

        // Bloom
        this.bloomPass = bloom(scenePassEmissive, 1.5, 0.2, 0.1);

        // Output
        this.postProcessing.outputNode = fxaaPass.add(this.bloomPass);
    }

    async render() {
        const elapsedTime = this.clock.getElapsedTime();

        if (this.stats) {
            this.renderer.resolveTimestampsAsync(TimestampQuery.COMPUTE);
        }

        this.controls.update();

        // Animate point lights in figure-8 pattern
        const time = elapsedTime * 0.8;
        const radius = 4;

        // First light: figure-8 pattern
        this.pointLight1.position.x = radius * Math.sin(time);
        this.pointLight1.position.y = radius * Math.sin(time) * Math.cos(time);
        this.pointLight1.position.z = 0;

        // Second light: offset figure-8 pattern with slight delay
        this.pointLight2.position.x = radius * Math.sin(time + Math.PI + 0.3);
        this.pointLight2.position.y = radius * Math.sin(time + Math.PI + 0.3) * Math.cos(time + Math.PI + 0.3);
        this.pointLight2.position.z = 0;

        if (this.mesh) {
            super.render(this.usePostprocessing ? this.postProcessing : undefined);
        }
    }

    onWindowResize() {
        super.onWindowResize();
        this.camera.position.z = window.innerWidth > 1199 ? 5 : 8;
    }

    destroy() {
        super.destroy();
        this.mesh?.dispose();
        this.controls.dispose();

        this.canvas.removeEventListener('click', this.animateProgress);
        document.removeEventListener('keydown', this.handleKeydown);
        if (this.progressButton) {
            this.progressButton.off('click', this.animateProgress);
        }
    }

    initTweakPane() {
        super.initTweakPane();

        if (!this.tweakPane || !this.mesh) return;

        this.tweakPane.addBinding(this.mesh.uniforms.progress, 'value', {
            min: 0,
            max: 1,
            step: 0.001,
            label: 'Progress',
        });

        this.progressButton = this.tweakPane.addButton({ title: 'Animate Progress' });
        this.isVisible = true;

        this.animateProgress = () => {
            if (this.mesh) {
                animate(
                    this.mesh.uniforms.progress,
                    {
                        value: this.isVisible ? 1 : 0,
                    },
                    {
                        duration: 2,
                        ease: easeInOutCubic,
                        onUpdate: () => {
                            this.tweakPane?.refresh();
                        },
                    },
                );
                this.isVisible = !this.isVisible;
            }
        };

        this.handleKeydown = (event: KeyboardEvent) => {
            if (event.key === ' ') {
                this.animateProgress();
            }
        };

        this.progressButton.on('click', this.animateProgress);
        document.addEventListener('keydown', this.handleKeydown);

        if (!matchMedia('(any-hover: hover), (hover: hover) and (pointer: fine)').matches) {
            this.canvas.addEventListener('click', this.animateProgress);
        }

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

        this.tweakPane.addBinding(this.mesh.uniforms.noiseOffset, 'value', {
            min: -10,
            max: 10,
            step: 0.001,
            label: 'Noise Offset',
        });

        const proxy = {
            color: '#00d4e8',
        };

        this.tweakPane
            .addBinding(proxy, 'color', {
                label: 'Particles Color',
            })
            .on('change', (value) => {
                if (this.mesh) {
                    this.mesh.uniforms.particles.color.value.set(value.value);
                }
            });

        this.tweakPane.addBinding(this.mesh.uniforms.particles.size, 'value', {
            min: 0,
            max: 2,
            step: 0.001,
            label: 'Particles Size',
        });

        this.tweakPane.addBinding(this.mesh.uniforms.particles.speed, 'value', {
            min: 0,
            max: 0.005,
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

export default Dissolve;
