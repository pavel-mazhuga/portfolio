import { renderOutput, texture } from 'three/tsl';
import { NoToneMapping, RenderPipeline, SRGBColorSpace, TextureLoader, TimestampQuery, Vector2 } from 'three/webgpu';
import BaseExperience from '../model/BaseExperience';
import { FlowmapNode } from './FlowmapNode';
import { FlowmapSimulator } from './FlowmapSimulator';

const SOURCE_URL =
    'https://images.unsplash.com/photo-1649706796644-c507eb2835bb?q=80&w=3121&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';

const FLOWMAP_DEFAULTS = {
    enabled: true,
    power: 0.3,
    range: 0.1,
    viscosity: 0.04,
    strength: 5,
    isPixel: false,
    pixel: 20,
    rgbShift: true,
    rgbShiftStrength: 1,
    showMotion: false,
    autoPlay: true,
};

class FlowmapDemo extends BaseExperience {
    simulator: FlowmapSimulator;
    flowmapPass: FlowmapNode;
    sourceColor: ReturnType<typeof texture>;
    postProcessing: RenderPipeline;

    normalizedMouse = new Vector2(0, 0);
    defaultMouse = new Vector2(0, 0);
    hasPointer = false;

    params = {
        flowmap: { ...FLOWMAP_DEFAULTS },
    };

    private readonly updatePointer = (event: PointerEvent) => {
        const rect = this.canvas.getBoundingClientRect();

        this.hasPointer = true;
        this.normalizedMouse.set((event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height);
    };

    private readonly onPointerDown = (event: PointerEvent) => {
        this.canvas.setPointerCapture(event.pointerId);
        this.updatePointer(event);
    };

    private readonly onPointerMove = (event: PointerEvent) => {
        if (event.pointerType !== 'mouse' && !this.canvas.hasPointerCapture(event.pointerId)) {
            return;
        }

        this.updatePointer(event);
    };

    private readonly onPointerUp = (event: PointerEvent) => {
        if (this.canvas.hasPointerCapture(event.pointerId)) {
            this.canvas.releasePointerCapture(event.pointerId);
        }
    };

    constructor(canvas: HTMLCanvasElement) {
        super(canvas, { antialias: false });

        this.renderer.toneMapping = NoToneMapping;

        const width = canvas.parentElement?.offsetWidth || 1;
        const height = canvas.parentElement?.offsetHeight || 1;

        const loader = new TextureLoader();

        loader.setCrossOrigin('anonymous');

        const sourceTexture = loader.load(SOURCE_URL, (tex) => {
            tex.colorSpace = SRGBColorSpace;
            tex.flipY = false;
            this.flowmapPass.imageNaturalSize.value.set(tex.image.naturalWidth, tex.image.naturalHeight);
        });

        sourceTexture.colorSpace = SRGBColorSpace;
        sourceTexture.flipY = false;

        this.sourceColor = texture(sourceTexture);

        this.simulator = new FlowmapSimulator(width, height);

        this.flowmapPass = new FlowmapNode(this.sourceColor, this.simulator.texture, {
            power: FLOWMAP_DEFAULTS.power,
            aspect: width / height,
            pixelMode: FLOWMAP_DEFAULTS.isPixel,
            pixel: FLOWMAP_DEFAULTS.pixel,
            rgbShift: FLOWMAP_DEFAULTS.rgbShift,
            rgbShiftStrength: FLOWMAP_DEFAULTS.rgbShiftStrength,
            viewportSize: new Vector2(width, height),
        });

        this.postProcessing = new RenderPipeline(this.renderer);
        this.postProcessing.outputColorTransform = false;
        this.updateOutputNode();

        this.canvas.addEventListener('pointerdown', this.onPointerDown);
        this.canvas.addEventListener('pointermove', this.onPointerMove);
        this.canvas.addEventListener('pointerup', this.onPointerUp);
        this.canvas.addEventListener('pointercancel', this.onPointerUp);
        this.initTweakPane();
    }

    private updateOutputNode() {
        const color = this.params.flowmap.enabled ? this.flowmapPass : this.sourceColor;

        this.postProcessing.outputNode = renderOutput(color);
    }

    override onWindowResize() {
        super.onWindowResize();

        if (!this.simulator) {
            return;
        }

        const width = this.canvas.parentElement?.offsetWidth || 1;
        const height = this.canvas.parentElement?.offsetHeight || 1;

        this.simulator.setSize(width, height);

        if (this.flowmapPass) {
            this.flowmapPass.aspect.value = width / height;
            this.flowmapPass.viewportSize.value.set(width, height);
        }
    }

    async render() {
        if (this.stats) {
            this.renderer.resolveTimestampsAsync(TimestampQuery.COMPUTE);
        }

        if (this.params.flowmap.enabled) {
            if (!this.hasPointer && this.params.flowmap.autoPlay) {
                const t = this.clock.getElapsed();

                this.defaultMouse.set(0.5 + 0.3 * Math.sin(t * 0.5), 0.5 + 0.3 * Math.cos(t * 0.7));
            }

            const mouse = this.hasPointer ? this.normalizedMouse : this.defaultMouse;

            this.simulator.compute(
                this.renderer,
                mouse,
                this.params.flowmap.range,
                this.params.flowmap.viscosity,
                this.params.flowmap.strength,
            );
            this.flowmapPass.setMotionTexture(this.simulator.texture);
            this.flowmapPass.power.value = this.params.flowmap.power;
            this.flowmapPass.pixelMode.value = this.params.flowmap.isPixel;
            this.flowmapPass.pixel.value = this.params.flowmap.pixel;
            this.flowmapPass.rgbShift.value = this.params.flowmap.rgbShift;
            this.flowmapPass.rgbShiftStrength.value = this.params.flowmap.rgbShiftStrength;
            this.flowmapPass.showMotion.value = this.params.flowmap.showMotion;
        }

        this.updateOutputNode();

        super.render(this.postProcessing);
    }

    override destroy() {
        this.canvas.removeEventListener('pointerdown', this.onPointerDown);
        this.canvas.removeEventListener('pointermove', this.onPointerMove);
        this.canvas.removeEventListener('pointerup', this.onPointerUp);
        this.canvas.removeEventListener('pointercancel', this.onPointerUp);

        this.simulator.dispose();
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
        flowmapFolder.addBinding(this.params.flowmap, 'autoPlay', { label: 'Auto Play' });

        const simFolder = flowmapFolder.addFolder({ title: 'Simulation', expanded: true });

        simFolder.addBinding(this.params.flowmap, 'range', { label: 'Brush Size', min: 0.01, max: 0.5, step: 0.01 });
        simFolder.addBinding(this.params.flowmap, 'viscosity', { min: 0.001, max: 0.3, step: 0.001 });
        simFolder.addBinding(this.params.flowmap, 'strength', { min: 0, max: 20, step: 0.1 });

        const distortionFolder = flowmapFolder.addFolder({ title: 'Distortion', expanded: true });

        distortionFolder.addBinding(this.params.flowmap, 'power', { min: 0.01, max: 1, step: 0.01 });
        distortionFolder.addBinding(this.params.flowmap, 'rgbShift', { label: 'RGB Shift' });
        distortionFolder.addBinding(this.params.flowmap, 'rgbShiftStrength', {
            label: 'RGB Shift Strength',
            min: 0,
            max: 2,
            step: 0.01,
        });
        distortionFolder.addBinding(this.params.flowmap, 'isPixel', { label: 'Pixel Mode' });
        distortionFolder.addBinding(this.params.flowmap, 'pixel', { min: 4, max: 80, step: 1 });

        flowmapFolder.addBinding(this.params.flowmap, 'showMotion', { label: 'Show Motion Map' });
    }
}

export default FlowmapDemo;
