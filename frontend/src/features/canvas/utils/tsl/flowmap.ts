import { convertToTexture, floor, Fn, If, texture, uniform, uv, vec2, vec4 } from 'three/tsl';
import { TempNode, type Node, type Texture } from 'three/webgpu';

export type FlowmapPassParams = {
    power: number;
    aspect: number;
    pixelMode: boolean;
    pixel: number;
    rgbShift: boolean;
};

export class FlowmapNode extends TempNode {
    inputNode: ReturnType<typeof convertToTexture>;
    motionTextureNode: ReturnType<typeof texture>;

    power = uniform(0.3);
    aspect = uniform(1);
    pixelMode = uniform(false);
    pixel = uniform(20);
    rgbShift = uniform(true);

    constructor(inputNode: Node, motionTexture: Texture, params: FlowmapPassParams) {
        super('vec4');

        this.inputNode = convertToTexture(inputNode);
        this.motionTextureNode = texture(motionTexture);

        this.power.value = params.power;
        this.aspect.value = params.aspect;
        this.pixelMode.value = params.pixelMode;
        this.pixel.value = params.pixel;
        this.rgbShift.value = params.rgbShift;
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

            const motion = this.motionTextureNode.sample(st);
            const distortion = motion.xy.mul(this.power).mul(-1);
            const sampleUv = vUv.add(distortion);
            const color = this.inputNode.sample(sampleUv).toVar();

            If(this.rgbShift, () => {
                const texR = this.inputNode.sample(vUv.add(distortion.mul(0.5))).r;
                const texG = this.inputNode.sample(vUv.add(distortion.mul(0.75))).g;
                const texB = this.inputNode.sample(vUv.add(distortion)).b;

                color.assign(vec4(texR, texG, texB, color.a));
            });

            return color;
        })();
    }
}

export function flowmap(inputNode: Node, motionTexture: Texture, params: FlowmapPassParams) {
    return new FlowmapNode(inputNode, motionTexture, params);
}
