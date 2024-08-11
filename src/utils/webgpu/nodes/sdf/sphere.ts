import { Node, ShaderNodeObject, tslFn } from 'three/webgpu';

export const sdSphere = tslFn<ShaderNodeObject<Node>[]>(([p, r]) => {
    return p.length().sub(r);
});
