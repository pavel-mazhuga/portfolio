import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Fn, mx_fractal_noise_vec3, screenUV, time, vec3, vec4 } from 'three/tsl';
import { DirectionalLight, MeshStandardNodeMaterial, PointLight, SphereGeometry, TimestampQuery } from 'three/webgpu';
import BaseExperience from '../BaseExperience';
import { DestroyableMesh } from './DestroyableMesh';

class MeshParticlesDestroy extends BaseExperience {
    mesh?: DestroyableMesh;
    pointLight1: PointLight;
    pointLight2: PointLight;

    params = {};

    constructor(canvas: HTMLCanvasElement) {
        super(canvas, { antialias: true });
        this.camera.position.z = window.innerWidth <= 576 ? 7 : 5;

        const directionalLight = new DirectionalLight('#fff', 0.1);
        directionalLight.position.set(0, 0.5, 1);
        this.scene.add(directionalLight);

        // Point lights flying in figure-8 pattern
        this.pointLight1 = new PointLight(0xff6b6b, 1, 50);
        this.pointLight2 = new PointLight(0x4ecdc4, 1, 50);
        this.scene.add(this.pointLight1);
        this.scene.add(this.pointLight2);

        this.scene.backgroundNode = Fn(() => {
            const color = vec3(mx_fractal_noise_vec3(vec3(screenUV, time.mul(0.3)))).toVar();
            color.mulAssign(0.05);

            return vec4(color, 1);
        })();

        const loader = new GLTFLoader();
        loader.load('/gltf/suzanne.glb', (gltf) => {
            const suzanne = gltf.scene;
            const suzanneMesh = suzanne.children[0] as any;

            this.mesh = new DestroyableMesh(
                suzanneMesh.geometry,
                new MeshStandardNodeMaterial({
                    colorNode: vec3(1),
                }),
                // new PlaneGeometry(0.1, 0.1),
                new SphereGeometry(0.02, 16, 16),
            );
            this.scene.add(this.mesh);

            this.canvas.addEventListener('click', () => {
                this.mesh?.destroy(this.clock.getElapsedTime());
            });

            this.initTweakPane();
        });
    }

    async render() {
        const elapsedTime = this.clock.getElapsedTime();

        if (this.stats) {
            this.renderer.resolveTimestampsAsync(TimestampQuery.COMPUTE);
        }

        // Animate point lights in figure-8 pattern
        const time = elapsedTime * 0.8;
        const radius = 1;

        // First light: figure-8 pattern
        this.pointLight1.position.x = radius * Math.sin(time);
        this.pointLight1.position.y = radius * Math.sin(time) * Math.cos(time);
        this.pointLight1.position.z = radius * Math.sin(time);

        // Second light: offset figure-8 pattern with slight delay
        this.pointLight2.position.x = radius * Math.sin(time + Math.PI);
        this.pointLight2.position.y = radius * Math.sin(time + Math.PI + 0.3) * Math.cos(time + Math.PI + 0.3);
        this.pointLight2.position.z = radius * Math.cos(time + Math.PI + 0.3);

        super.render();
    }

    onWindowResize(): void {
        super.onWindowResize();
        this.camera.position.z = window.innerWidth <= 576 ? 7 : 5;
    }

    destroy() {
        super.destroy();
    }

    initTweakPane() {
        super.initTweakPane();

        if (this.tweakPane) {
            this.tweakPane.addButton({ title: 'Reset' }).on('click', () => {
                this.mesh?.reset();
            });

            if (this.mesh) {
                this.tweakPane.addBinding(this.mesh.uniforms.speedMin, 'value', {
                    min: 0,
                    max: 2,
                    step: 0.01,
                    label: 'Speed Min',
                });

                this.tweakPane.addBinding(this.mesh.uniforms.speedMax, 'value', {
                    min: 0,
                    max: 2,
                    step: 0.01,
                    label: 'Speed Max',
                });

                this.tweakPane.addBinding(this.mesh.uniforms.lifeMin, 'value', {
                    min: 0,
                    max: 0.5,
                    step: 0.01,
                    label: 'Life Min',
                });

                this.tweakPane.addBinding(this.mesh.uniforms.lifeMax, 'value', {
                    min: 0.5,
                    max: 1,
                    step: 0.01,
                    label: 'Life Max',
                });
            }
        }
    }
}

export default MeshParticlesDestroy;
