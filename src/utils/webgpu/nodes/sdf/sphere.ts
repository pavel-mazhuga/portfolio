import { Fn, ShaderNodeObject } from 'three/tsl';
import { Node } from 'three/webgpu';

export const sdSphere = Fn<ShaderNodeObject<Node>[]>(([p, r]) => {
    return p.length().sub(r);
});
