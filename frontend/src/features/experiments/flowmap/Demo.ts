import { fxaa } from 'three/addons/tsl/display/FXAANode.js';
import BloomNode, { bloom } from 'three/examples/jsm/tsl/display/BloomNode.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { add, pass, vec4 } from 'three/tsl';
import {
    AmbientLight,
    DoubleSide,
    Group,
    Mesh,
    MeshBasicNodeMaterial,
    PointLight,
    RenderPipeline,
    TimestampQuery,
    Vector2,
    type Node,
} from 'three/webgpu';
import BaseExperience from '../model/BaseExperience';
import { FlowmapNode } from './FlowmapNode';
import { FlowmapSimulator } from './FlowmapSimulator';
import { ReflectorFloor } from './ReflectorFloor';

const FLOWMAP_DEFAULTS = {
    enabled: true,
    power: 0.3,
    range: 0.1,
    viscosity: 0.04,
    isPixel: false,
    pixel: 20,
    rgbShift: true,
};

const BLOOM_DEFAULTS = {
    enabled: true,
    exposure: 0.8,
    strength: 0.5,
    radius: 1.45,
    threshold: 0.15,
};

const FXAA_DEFAULTS = {
    enabled: true,
};

class FlowmapDemo extends BaseExperience {
    controls: OrbitControls;
    suzanne?: Group;
    floor: ReflectorFloor;
    pointLight1: PointLight;
    pointLight2: PointLight;
    simulator: FlowmapSimulator;
    flowmapPass: FlowmapNode;
    bloomPass: BloomNode;
    postProcessing: RenderPipeline;
    sceneColor: Node<'vec4'>;
    fxaaColor: ReturnType<typeof fxaa>;
    combinedColor: Node<'vec4'>;

    normalizedMouse = new Vector2(0, 0);
    defaultMouse = new Vector2(0, 0);
    hasPointer = false;

    params = {
        flowmap: { ...FLOWMAP_DEFAULTS },
        bloom: { ...BLOOM_DEFAULTS },
        fxaa: { ...FXAA_DEFAULTS },
    };

    private readonly onPointerMove = (event: PointerEvent) => {
        this.hasPointer = true;
        this.normalizedMouse.set(
            event.clientX / this.canvas.offsetWidth,
            1 - event.clientY / this.canvas.offsetHeight,
        );
    };

    constructor(canvas: HTMLCanvasElement) {
        super(canvas, { antialias: false });

        const width = canvas.parentElement?.offsetWidth || 1;
        const height = canvas.parentElement?.offsetHeight || 1;

        this.camera.fov = 50;
        this.camera.near = 0.1;
        this.camera.far = 2000;
        this.camera.position.set(0, 0, 10);
        this.camera.updateProjectionMatrix();

        this.scene.backgroundNode = vec4(0, 0, 0, 1);

        this.controls = new OrbitControls(this.camera, this.canvas);
        this.controls.target.set(0, 1.5, 0);
        this.controls.enablePan = false;
        this.controls.enableZoom = false;
        this.controls.minPolarAngle = Math.PI / 4;
        this.controls.maxPolarAngle = Math.PI / 2;
        this.controls.enableDamping = true;

        this.scene.add(new AmbientLight());

        this.pointLight1 = new PointLight(0xff6b6b, 1.5, 10);
        this.pointLight2 = new PointLight(0x4ecdc4, 1.5, 10);
        this.scene.add(this.pointLight1);
        this.scene.add(this.pointLight2);

        this.floor = new ReflectorFloor('/static/textures/flowmap/SurfaceImperfections003_1K_var1.jpg');
        this.scene.add(this.floor);

        const loader = new GLTFLoader();

        loader.load('/static/gltf/suzanne.glb', (gltf) => {
            this.suzanne = gltf.scene;

            this.suzanne.traverse((child) => {
                if (child instanceof Mesh) {
                    child.material = new MeshBasicNodeMaterial({
                        color: 0xffffff,
                        toneMapped: false,
                        side: DoubleSide,
                    });
                }
            });

            this.scene.add(this.suzanne);
            this.initTweakPane();
        });

        this.simulator = new FlowmapSimulator(width, height);

        const scenePass = pass(this.scene, this.camera);

        this.sceneColor = scenePass.getTextureNode('output');
        this.fxaaColor = fxaa(this.sceneColor);
        this.bloomPass = bloom(scenePass, BLOOM_DEFAULTS.strength, BLOOM_DEFAULTS.radius, BLOOM_DEFAULTS.threshold);
        this.combinedColor = add(
            this.fxaaColor as unknown as Node<'vec4'>,
            this.bloomPass as unknown as Node<'vec4'>,
        );

        this.flowmapPass = new FlowmapNode(this.combinedColor, this.simulator.texture, {
            power: FLOWMAP_DEFAULTS.power,
            aspect: width / height,
            pixelMode: FLOWMAP_DEFAULTS.isPixel,
            pixel: FLOWMAP_DEFAULTS.pixel,
            rgbShift: FLOWMAP_DEFAULTS.rgbShift,
        });

        this.postProcessing = new RenderPipeline(this.renderer);
        this.postProcessing.outputNode = this.flowmapPass;
        this.renderer.toneMappingExposure = Math.pow(BLOOM_DEFAULTS.exposure, 4);

        window.addEventListener('pointermove', this.onPointerMove);
    }

    private updateOutputNode() {
        const color = this.params.fxaa.enabled ? this.fxaaColor : this.sceneColor;
        const withBloom = this.params.bloom.enabled
            ? add(color as unknown as Node<'vec4'>, this.bloomPass as unknown as Node<'vec4'>)
            : color;

        this.postProcessing.outputNode = this.params.flowmap.enabled ? this.flowmapPass : withBloom;
    }

    override onWindowResize() {
        super.onWindowResize();

        const width = this.canvas.parentElement?.offsetWidth || 1;
        const height = this.canvas.parentElement?.offsetHeight || 1;

        this.simulator.setSize(width, height);
        this.flowmapPass.aspect.value = width / height;
    }

    async render() {
        if (this.stats) {
            this.renderer.resolveTimestampsAsync(TimestampQuery.COMPUTE);
        }

        this.controls.update();

        const elapsedTime = this.clock.getElapsed();
        const lightTime = elapsedTime * 0.8;
        const radius = 4;

        this.pointLight1.position.set(
            radius * Math.sin(lightTime),
            radius * Math.sin(lightTime) * Math.cos(lightTime),
            0,
        );

        this.pointLight2.position.set(
            radius * Math.sin(lightTime + Math.PI + 0.3),
            radius * Math.sin(lightTime + Math.PI + 0.3) * Math.cos(lightTime + Math.PI + 0.3),
            0,
        );

        if (this.suzanne) {
            this.suzanne.position.y = 0.7 * Math.sin(elapsedTime * 0.3) + 1.0;
        }

        if (this.params.flowmap.enabled) {
            const mouse = this.hasPointer ? this.normalizedMouse : this.defaultMouse;

            this.simulator.compute(
                this.renderer,
                mouse,
                this.params.flowmap.range,
                this.params.flowmap.viscosity,
            );
            this.flowmapPass.setMotionTexture(this.simulator.texture);
            this.flowmapPass.power.value = this.params.flowmap.power;
            this.flowmapPass.pixelMode.value = this.params.flowmap.isPixel;
            this.flowmapPass.pixel.value = this.params.flowmap.pixel;
            this.flowmapPass.rgbShift.value = this.params.flowmap.rgbShift;
        }

        this.bloomPass.strength.value = this.params.bloom.strength;
        this.bloomPass.radius.value = this.params.bloom.radius;
        this.bloomPass.threshold.value = this.params.bloom.threshold;
        this.renderer.toneMappingExposure = this.params.bloom.enabled
            ? Math.pow(this.params.bloom.exposure, 4)
            : 1;

        this.updateOutputNode();

        super.render(this.postProcessing);
    }

    override destroy() {
        window.removeEventListener('pointermove', this.onPointerMove);

        this.controls.dispose();
        this.scene.remove(this.floor);
        this.floor.dispose();

        if (this.suzanne) {
            this.scene.remove(this.suzanne);
        }

        this.scene.remove(this.pointLight1);
        this.scene.remove(this.pointLight2);
        this.pointLight1.dispose();
        this.pointLight2.dispose();

        this.simulator.dispose();
        this.bloomPass.dispose();
        this.postProcessing.dispose();

        super.destroy();
    }

    initTweakPane() {
        super.initTweakPane();

        if (!this.tweakPane) {
            return;
        }

        const flowmapFolder = this.tweakPane.addFolder({ title: 'Flowmap' });

        flowmapFolder.addBinding(this.params.flowmap, 'enabled', { label: 'Enabled' }).on('change', () => {
            this.updateOutputNode();
        });
        flowmapFolder.addBinding(this.params.flowmap, 'power', { min: 0.1, max: 0.5, step: 0.01 });
        flowmapFolder.addBinding(this.params.flowmap, 'range', { min: 0.1, max: 0.2, step: 0.01 });
        flowmapFolder.addBinding(this.params.flowmap, 'viscosity', { min: 0.01, max: 0.1, step: 0.01 });
        flowmapFolder.addBinding(this.params.flowmap, 'isPixel', { label: 'Pixel Mode' });
        flowmapFolder.addBinding(this.params.flowmap, 'pixel', { min: 10, max: 50, step: 10 });
        flowmapFolder.addBinding(this.params.flowmap, 'rgbShift', { label: 'RGB Shift' });

        const bloomFolder = this.tweakPane.addFolder({ title: 'Bloom', expanded: false });

        bloomFolder.addBinding(this.params.bloom, 'enabled', { label: 'Enabled' }).on('change', () => {
            this.updateOutputNode();
        });
        bloomFolder.addBinding(this.params.bloom, 'exposure', { min: 0.1, max: 2, step: 0.01 });
        bloomFolder.addBinding(this.params.bloom, 'strength', { min: 0, max: 10, step: 0.1 });
        bloomFolder.addBinding(this.params.bloom, 'radius', { min: 0, max: 2, step: 0.01 });
        bloomFolder.addBinding(this.params.bloom, 'threshold', { min: 0, max: 1, step: 0.01 });

        const fxaaFolder = this.tweakPane.addFolder({ title: 'FXAA', expanded: false });

        fxaaFolder.addBinding(this.params.fxaa, 'enabled', { label: 'Enabled' }).on('change', () => {
            this.updateOutputNode();
        });
    }
}

export default FlowmapDemo;
