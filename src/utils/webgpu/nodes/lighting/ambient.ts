import { Node, ShaderNodeObject, tslFn } from 'three/webgpu';

export const ambientLightNode = tslFn<[ShaderNodeObject<Node>, ShaderNodeObject<Node>], ShaderNodeObject<Node>>(
    ([lightColor, intensity]) => {
        return lightColor.mul(intensity);
    },
);
