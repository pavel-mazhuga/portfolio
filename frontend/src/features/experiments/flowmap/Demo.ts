import { float, Fn, renderOutput, select, texture, uniform, vec4 } from 'three/tsl';
import {
    NoToneMapping,
    RenderPipeline,
    SRGBColorSpace,
    TextureLoader,
    TimestampQuery,
    Vector2,
    type Node,
} from 'three/webgpu';
import { CanvasUvPointer } from '../../canvas/utils/CanvasUvPointer';
import { FlowmapNode, FlowmapSimulator } from '../../canvas/utils/tsl/flowmap';
import { quantizeUv } from '../../canvas/utils/tsl/pixel';
import { sampleRgbShift, type TextureSampleNode } from '../../canvas/utils/tsl/rgb-shift';
import { coverTextureUv } from '../../canvas/utils/tsl/uv-cover';
import BaseExperience from '../model/BaseExperience';

const SOURCE_URL =
    'https://images.unsplash.com/photo-1484704849700-f032a568e944?q=80&w=2370&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';

class FlowmapDemo extends BaseExperience {
    simulator: FlowmapSimulator;
    flowmapPass: FlowmapNode;
    sourceColor: ReturnType<typeof texture>;
    postProcessing: RenderPipeline;

    flowmapAspect = uniform(1);
    flowmapPixelMode = uniform(false);
    flowmapPixel = uniform(20);
    flowmapRgbShift = uniform(true);
    flowmapRgbShiftStrength = uniform(1);
    flowmapShowMotion = uniform(false);
    flowmapImageNaturalSize = uniform(new Vector2(0, 0));
    flowmapViewportSize = uniform(new Vector2(1, 1));

    canvasPointer: CanvasUvPointer;

    params = {
        power: 0.3,
        range: 0.15,
        viscosity: 0.03,
        strength: 5,
        isPixel: false,
        pixel: 20,
        rgbShift: false,
        rgbShiftStrength: 1,
        showMotion: false,
    };

    private readonly updatePointer = (event: PointerEvent) => {
        this.canvasPointer.setFromEvent(event);
    };

    private stepSimulation() {
        this.simulator.compute(
            this.renderer,
            this.canvasPointer.uv,
            this.params.range,
            this.params.viscosity,
            this.params.strength,
        );
        this.flowmapPass.setMotionTexture(this.simulator.texture);
    }

    private readonly processPointerEvent = (event: PointerEvent) => {
        const events = typeof event.getCoalescedEvents === 'function' ? event.getCoalescedEvents() : [event];

        for (const coalescedEvent of events) {
            this.updatePointer(coalescedEvent);
            this.stepSimulation();
        }
    };

    private readonly onPointerDown = (event: PointerEvent) => {
        this.canvas.setPointerCapture(event.pointerId);
        this.processPointerEvent(event);
    };

    private readonly onPointerMove = (event: PointerEvent) => {
        if (this.canvas.hasPointerCapture(event.pointerId)) {
            return;
        }

        if (event.pointerType !== 'mouse') {
            return;
        }

        this.processPointerEvent(event);
    };

    private readonly onWindowPointerMove = (event: PointerEvent) => {
        if (!this.canvas.hasPointerCapture(event.pointerId)) {
            return;
        }

        this.processPointerEvent(event);
    };

    private readonly onPointerUp = (event: PointerEvent) => {
        if (this.canvas.hasPointerCapture(event.pointerId)) {
            this.canvas.releasePointerCapture(event.pointerId);
        }
    };

    constructor(canvas: HTMLCanvasElement) {
        super(canvas, { antialias: false });

        this.canvasPointer = new CanvasUvPointer(canvas);

        this.renderer.toneMapping = NoToneMapping;

        const width = canvas.parentElement?.offsetWidth || 1;
        const height = canvas.parentElement?.offsetHeight || 1;

        const loader = new TextureLoader();

        loader.setCrossOrigin('anonymous');

        const sourceTexture = loader.load(SOURCE_URL, (tex) => {
            tex.colorSpace = SRGBColorSpace;
            tex.flipY = false;
            this.flowmapImageNaturalSize.value.set(tex.image.naturalWidth, tex.image.naturalHeight);
        });

        sourceTexture.colorSpace = SRGBColorSpace;
        sourceTexture.flipY = false;

        this.sourceColor = texture(sourceTexture);

        this.simulator = new FlowmapSimulator(width, height);

        this.flowmapAspect.value = width / height;
        this.flowmapViewportSize.value.set(width, height);
        this.flowmapPixelMode.value = this.params.isPixel;
        this.flowmapPixel.value = this.params.pixel;
        this.flowmapRgbShift.value = this.params.rgbShift;
        this.flowmapRgbShiftStrength.value = this.params.rgbShiftStrength;
        this.flowmapShowMotion.value = this.params.showMotion;

        const resolveMotionUv = Fn(([vUv]: [Node<'vec2'>]) =>
            select(this.flowmapPixelMode, quantizeUv(vUv, this.flowmapAspect, this.flowmapPixel), vUv),
        );

        const resolveColor = Fn(
            ([tex, vUv, distortion, motion]: [TextureSampleNode, Node<'vec2'>, Node<'vec2'>, Node<'vec4'>]) => {
                const mapUv = select(
                    this.flowmapImageNaturalSize.x.greaterThan(float(0)),
                    coverTextureUv(this.flowmapImageNaturalSize, this.flowmapViewportSize, vUv),
                    vUv,
                );
                const color = select(
                    this.flowmapRgbShift,
                    sampleRgbShift(tex, mapUv, distortion, this.flowmapRgbShiftStrength),
                    tex.sample(mapUv.add(distortion)),
                );

                return select(this.flowmapShowMotion, vec4(motion.xy.mul(0.5).add(0.5), 0, 1), color);
            },
        );

        this.flowmapPass = new FlowmapNode(this.sourceColor, this.simulator.texture, {
            power: this.params.power,
            resolveMotionUv,
            resolveColor,
        });

        this.postProcessing = new RenderPipeline(this.renderer);
        this.postProcessing.outputColorTransform = false;
        this.postProcessing.outputNode = renderOutput(this.flowmapPass);

        this.canvas.addEventListener('pointerdown', this.onPointerDown);
        this.canvas.addEventListener('pointermove', this.onPointerMove);
        this.canvas.addEventListener('pointerup', this.onPointerUp);
        this.canvas.addEventListener('pointercancel', this.onPointerUp);
        window.addEventListener('pointermove', this.onWindowPointerMove);
        this.initTweakPane();
    }

    override onWindowResize() {
        super.onWindowResize();

        if (!this.simulator) {
            return;
        }

        const width = this.canvas.parentElement?.offsetWidth || 1;
        const height = this.canvas.parentElement?.offsetHeight || 1;

        this.simulator.setSize(width, height);
        this.canvasPointer.updateRect();
        this.flowmapAspect.value = width / height;
        this.flowmapViewportSize.value.set(width, height);
    }

    async render() {
        if (this.stats) {
            this.renderer.resolveTimestampsAsync(TimestampQuery.COMPUTE);
        }

        this.stepSimulation();
        this.flowmapPass.power.value = this.params.power;
        this.flowmapPixelMode.value = this.params.isPixel;
        this.flowmapPixel.value = this.params.pixel;
        this.flowmapRgbShift.value = this.params.rgbShift;
        this.flowmapRgbShiftStrength.value = this.params.rgbShiftStrength;
        this.flowmapShowMotion.value = this.params.showMotion;

        super.render(this.postProcessing);
    }

    override destroy() {
        this.canvas.removeEventListener('pointerdown', this.onPointerDown);
        this.canvas.removeEventListener('pointermove', this.onPointerMove);
        this.canvas.removeEventListener('pointerup', this.onPointerUp);
        this.canvas.removeEventListener('pointercancel', this.onPointerUp);
        window.removeEventListener('pointermove', this.onWindowPointerMove);

        this.canvasPointer.dispose();
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

        const simFolder = flowmapFolder.addFolder({ title: 'Simulation', expanded: true });

        simFolder.addBinding(this.params, 'range', { label: 'Brush Size', min: 0.01, max: 0.5, step: 0.01 });
        simFolder.addBinding(this.params, 'viscosity', { min: 0.001, max: 0.3, step: 0.001 });
        simFolder.addBinding(this.params, 'strength', { min: 0, max: 20, step: 0.1 });

        const distortionFolder = flowmapFolder.addFolder({ title: 'Distortion', expanded: true });

        distortionFolder.addBinding(this.params, 'power', { min: 0.01, max: 1, step: 0.01 });
        distortionFolder.addBinding(this.params, 'rgbShift', { label: 'RGB Shift' });
        distortionFolder.addBinding(this.params, 'rgbShiftStrength', {
            label: 'RGB Shift Strength',
            min: 0,
            max: 2,
            step: 0.01,
        });
        distortionFolder.addBinding(this.params, 'isPixel', { label: 'Pixel Mode' });
        distortionFolder.addBinding(this.params, 'pixel', { min: 4, max: 80, step: 1 });

        flowmapFolder.addBinding(this.params, 'showMotion', { label: 'Show Motion Map' });
    }
}

export default FlowmapDemo;
