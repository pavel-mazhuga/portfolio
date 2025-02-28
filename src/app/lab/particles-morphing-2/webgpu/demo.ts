import Stats from 'stats-gl';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Fn, mx_fractal_noise_vec3, screenUV, time, vec3, vec4 } from 'three/tsl';
import {
    ACESFilmicToneMapping,
    Clock,
    Color,
    Mesh,
    Object3D,
    PerspectiveCamera,
    Plane,
    Scene,
    Vector3,
    WebGPURenderer,
} from 'three/webgpu';
import { Pane } from 'tweakpane';
import { Pointer } from '@/utils/webgpu/Pointer';
import ParticlesMesh from './ParticlesMesh';

const models = ['/gltf/face2.glb', '/gltf/suzanne.glb'];

class Demo {
    canvas: HTMLCanvasElement;
    renderer: WebGPURenderer;
    camera: PerspectiveCamera;
    scene: Scene;
    controls?: OrbitControls;
    stats?: Stats;
    clock = new Clock();
    prevTime = 0;
    mesh?: ParticlesMesh;

    pointerHandler: Pointer;

    tweakPane?: Pane;

    constructor(canvas: HTMLCanvasElement) {
        this.render = this.render.bind(this);
        this.onWindowResize = this.onWindowResize.bind(this);
        this.morph = this.morph.bind(this);

        this.canvas = canvas;
        this.renderer = new WebGPURenderer({ canvas, powerPreference: 'high-performance' });
        this.renderer.toneMapping = ACESFilmicToneMapping;
        this.renderer.setPixelRatio(this.dpr);
        this.renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);

        this.scene = new Scene();
        this.scene.backgroundNode = Fn(() => {
            const color = vec3(mx_fractal_noise_vec3(vec3(screenUV, time.mul(0.3)))).toVar();
            color.mulAssign(0.03);
            return vec4(color, 1);
        })();

        this.camera = new PerspectiveCamera(60, canvas.width / canvas.height, 0.1, 500);
        this.camera.position.set(0, 0, 6);

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

                for (let i = 0; i < maxCount; i++) {
                    const i3 = i * 3;

                    if (i < originalPositions.length / 3) {
                        prepositions[i] = [
                            originalPositions[i3 + 0],
                            originalPositions[i3 + 1],
                            originalPositions[i3 + 2],
                        ];
                    } else {
                        const randomIndex = Math.floor(mesh.geometry.attributes.position.count * Math.random()) * 3;
                        prepositions[i] = [
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

        if (process.env.NODE_ENV === 'development') {
            this.stats = new Stats();
            this.stats.init(this.renderer);
            // canvas.parentElement?.appendChild(this.stats.dom);
        }

        this.#initEvents();
        this.#initTweakPane();

        this.renderer.setAnimationLoop(this.render);
    }

    get dpr() {
        return Math.min(window.devicePixelRatio, 1.5);
    }

    onWindowResize() {
        const width = this.canvas.parentElement?.offsetWidth || 1;
        const height = this.canvas.parentElement?.offsetHeight || 1;
        this.renderer.setPixelRatio(this.dpr);
        this.renderer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.controls?.update();
    }

    morph() {
        if (this.mesh) {
            this.mesh.setActiveIndex(this.mesh.uniforms.activeIndex.value === 0 ? 1 : 0);
        }
    }

    #initEvents() {
        window.addEventListener('resize', this.onWindowResize);
        this.canvas.addEventListener('click', this.morph);
    }

    #destroyEvents() {
        window.removeEventListener('resize', this.onWindowResize);
        this.canvas.removeEventListener('click', this.morph);
    }

    async render() {
        const delta = this.clock.getDelta();

        this.stats?.update();
        this.pointerHandler.update(delta);
        this.mesh?.update();

        this.renderer.renderAsync(this.scene, this.camera);
    }

    destroy() {
        this.renderer.setAnimationLoop(null);

        this.#destroyEvents();
        this.#destroyTweakPane();
        this.controls?.dispose();
        this.stats?.dom.remove();
        this.pointerHandler.destroy();
        this.mesh?.dispose();

        if (this.renderer.hasInitialized()) {
            this.renderer.dispose();
        }
    }

    #initTweakPane() {
        this.tweakPane = new Pane({
            title: 'Parameters',
            expanded: matchMedia('(min-width: 1200px)').matches,
        });
    }

    #destroyTweakPane() {
        this.tweakPane?.dispose();
    }
}

export default Demo;
