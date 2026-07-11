import { convertToTexture, float, floor, Fn, If, texture, uniform, uv, vec2, vec4 } from 'three/tsl';
import { TempNode, Vector2, type Node, type Texture } from 'three/webgpu';
import { coverTextureUv } from '../../canvas/utils/tsl/uv-cover';

export type FlowmapPassParams = {
    power: number;
    aspect: number;
    pixelMode: boolean;
    pixel: number;
    rgbShift: boolean;
    imageNaturalSize?: Vector2;
    viewportSize?: Vector2;
};

export class FlowmapNode extends TempNode {
    inputNode: ReturnType<typeof convertToTexture>;
    motionTextureNode: ReturnType<typeof texture>;

    power = uniform(0.3);
    aspect = uniform(1);
    pixelMode = uniform(false);
    pixel = uniform(20);
    rgbShift = uniform(true);
    imageNaturalSize = uniform(new Vector2(0, 0));
    viewportSize = uniform(new Vector2(1, 1));

    constructor(inputNode: Node, motionTexture: Texture, params: FlowmapPassParams) {
        super('vec4');

        this.inputNode = convertToTexture(inputNode);
        this.motionTextureNode = texture(motionTexture);

        this.power.value = params.power;
        this.aspect.value = params.aspect;
        this.pixelMode.value = params.pixelMode;
        this.pixel.value = params.pixel;
        this.rgbShift.value = params.rgbShift;

        if (params.imageNaturalSize) {
            this.imageNaturalSize.value.copy(params.imageNaturalSize);
        }

        if (params.viewportSize) {
            this.viewportSize.value.copy(params.viewportSize);
        }
    }

    setMotionTexture(motionTexture: Texture) {
        this.motionTextureNode.value = motionTexture;
    }

    setup() {
        return Fn(() => {
            const vUv = uv();
            const st = vUv.toVar();

            If(this.pixelMode, () => {
                const pixel = vec2(this.aspect.mul(this.pixel), this.pixel);

                st.assign(floor(vUv.mul(pixel)).div(pixel));
            });

            const mapUv = vUv.toVar();

            If(this.imageNaturalSize.x.greaterThan(float(0)), () => {
                mapUv.assign(coverTextureUv(this.imageNaturalSize, this.viewportSize, vUv));
            });

            const motion = this.motionTextureNode.sample(st);
            const distortion = motion.xy.mul(this.power).mul(-1);
            const sampleUv = mapUv.add(distortion);
            const color = this.inputNode.sample(sampleUv).toVar();

            If(this.rgbShift, () => {
                const texR = this.inputNode.sample(mapUv.add(distortion.mul(0.5))).r;
                const texG = this.inputNode.sample(mapUv.add(distortion.mul(0.75))).g;
                const texB = this.inputNode.sample(mapUv.add(distortion)).b;

                color.assign(vec4(texR, texG, texB, color.a));
            });

            return color;
        })();
    }
}

export function flowmap(inputNode: Node, motionTexture: Texture, params: FlowmapPassParams) {
    return new FlowmapNode(inputNode, motionTexture, params);
}
