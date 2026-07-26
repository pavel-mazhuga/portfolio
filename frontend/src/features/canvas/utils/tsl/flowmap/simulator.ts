import { distance, Fn, texture, uniform, uv, vec4 } from 'three/tsl';
import {
    DataTexture,
    FloatType,
    HalfFloatType,
    MirroredRepeatWrapping,
    NearestFilter,
    NodeMaterial,
    QuadMesh,
    RendererUtils,
    RenderTarget,
    RGBAFormat,
    Vector2,
    type TextureNode,
    type WebGPURenderer,
} from 'three/webgpu';

const quadMesh = new QuadMesh();

let rendererState: ReturnType<typeof RendererUtils.resetRendererState> | undefined;

function createRenderTarget(width: number, height: number) {
    const target = new RenderTarget(width, height, {
        depthBuffer: false,
        type: HalfFloatType,
        minFilter: NearestFilter,
        magFilter: NearestFilter,
    });

    target.texture.wrapS = MirroredRepeatWrapping;
    target.texture.wrapT = MirroredRepeatWrapping;

    return target;
}

function createDefaultTexture(width: number, height: number) {
    const data = new Float32Array(width * height * 4);
    const defaultTexture = new DataTexture(data, width, height, RGBAFormat, FloatType);

    defaultTexture.minFilter = NearestFilter;
    defaultTexture.magFilter = NearestFilter;
    defaultTexture.wrapS = MirroredRepeatWrapping;
    defaultTexture.wrapT = MirroredRepeatWrapping;
    defaultTexture.needsUpdate = true;

    return defaultTexture;
}

export class FlowmapSimulator {
    private width: number;
    private height: number;
    private readIndex = 0;
    private readonly rtA: RenderTarget;
    private readonly rtB: RenderTarget;
    private defaultTexture: DataTexture;
    private readonly defaultTextureNode: TextureNode;
    private readonly materialAtoB: NodeMaterial;
    private readonly materialBtoA: NodeMaterial;

    readonly uMousePos = uniform(new Vector2(0, 0));
    readonly uVelocity = uniform(new Vector2(0, 0));
    readonly uRange = uniform(0.1);
    readonly uViscosity = uniform(0.04);
    readonly uStrength = uniform(5);

    private readonly lastMouse = new Vector2(0, 0);

    constructor(width: number, height: number) {
        this.width = Math.max(2, Math.floor(width));
        this.height = Math.max(2, Math.floor(height));

        this.rtA = createRenderTarget(this.width, this.height);
        this.rtB = createRenderTarget(this.width, this.height);
        this.defaultTexture = createDefaultTexture(this.width, this.height);
        this.defaultTextureNode = texture(this.defaultTexture);

        const sampleA = texture(this.rtA.texture);
        const sampleB = texture(this.rtB.texture);

        this.materialAtoB = new NodeMaterial();
        this.materialAtoB.fragmentNode = this.createFragmentNode(sampleA);

        this.materialBtoA = new NodeMaterial();
        this.materialBtoA.fragmentNode = this.createFragmentNode(sampleB);
    }

    private createFragmentNode(motionTextureNode: TextureNode) {
        return Fn(() => {
            const st = uv().toVar('st');
            const tmp = motionTextureNode.sample(st).toVar('tmp');
            const defTmp = this.defaultTextureNode.sample(st).toVar('defTmp');

            const dist = distance(this.uMousePos, st).smoothstep(0, this.uRange).oneMinus();
            const distortion = this.uVelocity.mul(dist).mul(this.uStrength).toVar('distortion');

            tmp.xy.addAssign(distortion);

            const result = vec4(0).toVar('result');

            result.xy.assign(defTmp.xy.mul(this.uViscosity).add(tmp.xy.mul(this.uViscosity.oneMinus())));
            result.xy.assign(result.xy.clamp(-1, 1));
            result.zw.assign(this.uMousePos);

            return result;
        })();
    }

    setSize(width: number, height: number) {
        const nextWidth = Math.max(2, Math.floor(width));
        const nextHeight = Math.max(2, Math.floor(height));

        if (nextWidth === this.width && nextHeight === this.height) {
            return;
        }

        this.width = nextWidth;
        this.height = nextHeight;

        this.rtA.setSize(nextWidth, nextHeight);
        this.rtB.setSize(nextWidth, nextHeight);
        this.defaultTexture.dispose();
        this.defaultTexture = createDefaultTexture(nextWidth, nextHeight);
        this.defaultTextureNode.value = this.defaultTexture;
        this.readIndex = 0;
        this.lastMouse.set(0, 0);
        this.uVelocity.value.set(0, 0);
    }

    compute(
        renderer: WebGPURenderer,
        mouse: Vector2,
        range: number,
        viscosity: number,
        strength: number,
        seed = false,
    ) {
        if (seed) {
            this.lastMouse.copy(mouse);
            this.uVelocity.value.set(0, 0);
        } else {
            this.uVelocity.value.set(mouse.x - this.lastMouse.x, mouse.y - this.lastMouse.y);
            this.lastMouse.copy(mouse);
        }

        this.uMousePos.value.copy(mouse);
        this.uRange.value = range;
        this.uViscosity.value = viscosity;
        this.uStrength.value = strength;

        const writeTarget = this.readIndex === 0 ? this.rtB : this.rtA;
        const material = this.readIndex === 0 ? this.materialAtoB : this.materialBtoA;

        rendererState = RendererUtils.resetRendererState(renderer, rendererState as never);

        renderer.setRenderTarget(writeTarget);
        quadMesh.material = material;
        quadMesh.render(renderer);
        RendererUtils.restoreRendererState(renderer, rendererState);
        renderer.setRenderTarget(null);

        this.readIndex = 1 - this.readIndex;
    }

    get texture() {
        return (this.readIndex === 0 ? this.rtA : this.rtB).texture;
    }

    dispose() {
        this.rtA.dispose();
        this.rtB.dispose();
        this.defaultTexture.dispose();
        this.materialAtoB.dispose();
        this.materialBtoA.dispose();
    }
}
