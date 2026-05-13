import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Fn, mx_fractal_noise_vec3, screenUV, time, vec3, vec4 } from 'three/tsl';
import { DirectionalLight, MeshStandardNodeMaterial, PointLight, SphereGeometry, TimestampQuery } from 'three/webgpu';
import BaseExperience from '../model/BaseExperience';
import { DestroyableMesh } from './DestroyableMesh';

class MeshParticlesDestroy extends BaseExperience {
    mesh?: DestroyableMesh;
    pointLight1: PointLight;
    pointLight2: PointLight;

    params = {};

    private readonly onCanvasClick = () => {
        this.mesh?.destroy(this.clock.getElapsed());
    };

    constructor(canvas: HTMLCanvasElement) {
        super(canvas, { antialias: true });
        this.camera.position.z = window.innerWidth <= 576 ? 7 : 5;

        const directionalLight = new DirectionalLight('#fff', 0.1);

        directionalLight.position.set(0, 0.5, 1);
        this.scene.add(directionalLight);

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

        loader.load('/static/gltf/suzanne.glb', (gltf) => {
            const suzanne = gltf.scene;
            const suzanneMesh = suzanne.children[0] as any;

            this.mesh = new DestroyableMesh(
                suzanneMesh.geometry,
                new MeshStandardNodeMaterial({
                    colorNode: vec3(1),
                }),
                new SphereGeometry(0.02, 16, 16),
            );
            this.scene.add(this.mesh);

            this.canvas.addEventListener('click', this.onCanvasClick);

            this.initTweakPane();
        });
    }

    async render() {
        const elapsedTime = this.clock.getElapsed();

        if (this.stats) {
            this.renderer.resolveTimestampsAsync(TimestampQuery.COMPUTE);
        }

        const t = elapsedTime * 0.8;
        const radius = 1;

        this.pointLight1.position.x = radius * Math.sin(t);
        this.pointLight1.position.y = radius * Math.sin(t) * Math.cos(t);
        this.pointLight1.position.z = radius * Math.sin(t);

        this.pointLight2.position.x = radius * Math.sin(t + Math.PI);
        this.pointLight2.position.y = radius * Math.sin(t + Math.PI + 0.3) * Math.cos(t + Math.PI + 0.3);
        this.pointLight2.position.z = radius * Math.cos(t + Math.PI + 0.3);

        await super.render();
    }

    onWindowResize(): void {
        super.onWindowResize();
        this.camera.position.z = window.innerWidth <= 576 ? 7 : 5;
    }

    destroy() {
        this.canvas.removeEventListener('click', this.onCanvasClick);
        this.scene.remove(this.pointLight1);
        this.scene.remove(this.pointLight2);
        this.pointLight1.dispose();
        this.pointLight2.dispose();

        if (this.mesh) {
            this.scene.remove(this.mesh);
            this.mesh.dispose();
        }
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
