import { Fn, texture, uniform, uv, vec3, vec4 } from 'three/tsl';
import {
    HalfFloatType,
    LinearFilter,
    NodeMaterial,
    QuadMesh,
    RendererUtils,
    RenderTarget,
    RepeatWrapping,
    type TextureNode,
    type WebGPURenderer,
} from 'three/webgpu';
import { curlNoise } from '../noise/curlNoise3d';

const quadMesh = new QuadMesh();

let rendererState: ReturnType<typeof RendererUtils.resetRendererState> | undefined;

function createRenderTarget(width: number, height: number) {
    const target = new RenderTarget(width, height, {
        depthBuffer: false,
        type: HalfFloatType,
        minFilter: LinearFilter,
        magFilter: LinearFilter,
    });

    target.texture.wrapS = RepeatWrapping;
    target.texture.wrapT = RepeatWrapping;

    return target;
}

function getMapSize(aspect: number, pixel: number) {
    return {
        width: Math.max(2, Math.floor(aspect * pixel)),
        height: Math.max(2, Math.floor(pixel)),
    };
}

export class CurlUvField {
    private width: number;
    private height: number;
    private readonly rt: RenderTarget;
    private readonly material = new NodeMaterial();
    private readonly offsetTextureNode: TextureNode;

    readonly uScale = uniform(3);
    readonly uTime = uniform(0);
    readonly uStrength = uniform(0.05);

    constructor(aspect: number, pixel: number) {
        const size = getMapSize(aspect, pixel);

        this.width = size.width;
        this.height = size.height;
        this.rt = createRenderTarget(this.width, this.height);
        this.offsetTextureNode = texture(this.rt.texture);

        this.material.fragmentNode = Fn(() => {
            const st = uv().toVar();
            const scaledUv = st.mul(this.uScale).toVar();
            const curl = curlNoise(vec3(scaledUv.x, scaledUv.y, this.uTime)).toVar();

            return vec4(curl.xy.mul(this.uStrength), 0, 1);
        })();
    }

    setSize(aspect: number, pixel: number) {
        const size = getMapSize(aspect, pixel);

        if (size.width === this.width && size.height === this.height) {
            return;
        }

        this.width = size.width;
        this.height = size.height;
        this.rt.setSize(this.width, this.height);
    }

    compute(renderer: WebGPURenderer, scale: number, time: number, strength: number) {
        this.uScale.value = scale;
        this.uTime.value = time;
        this.uStrength.value = strength;

        rendererState = RendererUtils.resetRendererState(renderer, rendererState as never);

        renderer.setRenderTarget(this.rt);
        quadMesh.material = this.material;
        quadMesh.render(renderer);
        renderer.setRenderTarget(null);

        RendererUtils.restoreRendererState(renderer, rendererState);
    }

    get textureNode() {
        return this.offsetTextureNode;
    }

    dispose() {
        this.rt.dispose();
        this.material.dispose();
    }
}
