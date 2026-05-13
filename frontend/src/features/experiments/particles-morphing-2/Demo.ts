import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Fn, mx_fractal_noise_vec3, screenUV, time, vec3, vec4 } from 'three/tsl';
import { Color, Mesh, Object3D, Plane, TimestampQuery, Vector3 } from 'three/webgpu';
import { Pointer } from '../lib/Pointer';
import BaseExperience from '../model/BaseExperience';
import ParticlesMesh from './ParticlesMesh';

const models = ['/static/gltf/face2.glb', '/static/gltf/suzanne.glb'];

class Demo extends BaseExperience {
    mesh?: ParticlesMesh;

    pointerHandler!: Pointer;

    private readonly onCanvasMorphClick = () => {
        if (this.mesh) {
            this.mesh.setActiveIndex(this.mesh.uniforms.activeIndex.value === 0 ? 1 : 0);
        }
    };

    constructor(canvas: HTMLCanvasElement) {
        super(canvas);

        this.scene.backgroundNode = Fn(() => {
            const color = vec3(mx_fractal_noise_vec3(vec3(screenUV, time.mul(0.3)))).toVar();

            color.mulAssign(0.03);

            return vec4(color, 1);
        })();

        this.camera.fov = 60;
        this.camera.position.set(0, 0, 6);
        this.camera.updateProjectionMatrix();
        this.onWindowResize();

        this.pointerHandler = new Pointer(this.renderer, this.camera, new Plane(new Vector3(0, 0, 1), 0));

        const gltfLoader = new GLTFLoader();

        Promise.all(models.map((url) => gltfLoader.loadAsync(url))).then((gltfs) => {
            const getMesh = (scene: Object3D, index: number) => {
                if (index === 0) {
                    return scene.children[1].children[0].children[0].children[0] as Mesh;
                }

                return scene.children[0] as Mesh;
            };

            const maxCount = Math.max(
                ...gltfs.map((gltf, i) => getMesh(gltf.scene, i).geometry.attributes.position.count),
            );

            const basePos: number[][] = [];

            gltfs.forEach((gltf, i) => {
                const mesh = getMesh(gltf.scene, i);

                mesh.geometry.toNonIndexed();
                mesh.geometry.center();

                if (i === 0) {
                    mesh.geometry.rotateX(-Math.PI / 2);
                    const scale = 0.13;

                    mesh.geometry.scale(scale, scale, scale);
                } else if (i === 1) {
                    const scale = 1.7;

                    mesh.geometry.scale(scale, scale, scale);
                }

                const originalPositions = mesh.geometry.attributes.position.array;
                const prepositions: [number, number, number][] = [];

                for (let j = 0; j < maxCount; j++) {
                    const i3 = j * 3;

                    if (j < originalPositions.length / 3) {
                        prepositions[j] = [
                            originalPositions[i3 + 0],
                            originalPositions[i3 + 1],
                            originalPositions[i3 + 2],
                        ];
                    } else {
                        const randomIndex = Math.floor(mesh.geometry.attributes.position.count * Math.random()) * 3;

                        prepositions[j] = [
                            originalPositions[randomIndex + 0],
                            originalPositions[randomIndex + 1],
                            originalPositions[randomIndex + 2],
                        ];
                    }
                }

                basePos.push(prepositions.flat());
            });

            this.mesh = new ParticlesMesh(
                this.renderer,
                maxCount,
                basePos,
                [
                    [new Color('#FF0019'), new Color('#FF5F00')],
                    [new Color('#d1d915'), new Color('yellow')],
                ],
                this.pointerHandler,
            );
            this.scene.add(this.mesh);

            if (this.tweakPane) {
                this.mesh.initTweakPane(this.tweakPane);
            }
        });

        this.initTweakPane();

        this.canvas.addEventListener('click', this.onCanvasMorphClick);
    }

    get dpr() {
        return Math.min(window.devicePixelRatio, 1.5);
    }

    protected destroyEvents() {
        this.canvas.removeEventListener('click', this.onCanvasMorphClick);
        super.destroyEvents();
    }

    initTweakPane() {
        super.initTweakPane();

        if (this.tweakPane && this.mesh) {
            this.mesh.initTweakPane(this.tweakPane);
        }
    }

    async render() {
        if (this.stats) {
            this.renderer.resolveTimestampsAsync(TimestampQuery.COMPUTE);
        }

        this.clock.update();
        const elapsedTime = this.clock.getElapsed();

        this.delta = elapsedTime - this.prevTime;
        this.prevTime = elapsedTime;

        this.pointerHandler.update(this.delta);
        this.mesh?.update();

        this.renderer.render(this.scene, this.camera);

        if (this.stats) {
            this.renderer.resolveTimestampsAsync(TimestampQuery.RENDER);
            this.stats.update();
        }
    }

    destroy() {
        this.pointerHandler.destroy();
        this.mesh?.dispose();
        super.destroy();
    }
}

export default Demo;
