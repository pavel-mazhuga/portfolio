import { Fn, ShaderNodeObject, clamp } from 'three/tsl';
import { Node } from 'three/webgpu';

export const remapNode = Fn<ShaderNodeObject<Node>[]>(([value, in_min, in_max, out_min, out_max]: any) => {
    const mapped = value.sub(in_min).mul(out_max.sub(out_min)).div(in_max.sub(in_min)).add(out_min);
    return clamp(mapped, out_min, out_max);
});
