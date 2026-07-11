import { vec4 } from 'three/tsl';
import type { Node } from 'three/webgpu';

export type TextureSampleNode = {
    sample: (uv: Node<'vec2'>) => Node<'vec4'>;
};

export function sampleRgbShift(
    tex: TextureSampleNode,
    mapUv: Node<'vec2'>,
    distortion: Node<'vec2'>,
    strength: Node<'float'>,
) {
    const shift = strength;

    return vec4(
        tex.sample(mapUv.add(distortion.mul(shift.mul(0.5)))).r,
        tex.sample(mapUv.add(distortion.mul(shift.mul(0.75)))).g,
        tex.sample(mapUv.add(distortion.mul(shift))).b,
        tex.sample(mapUv.add(distortion.mul(shift))).a,
    );
}
