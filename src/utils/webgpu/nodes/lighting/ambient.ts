import { Fn, ShaderNodeObject } from 'three/tsl';
import { Node } from 'three/webgpu';

export const ambientLightNode = Fn<[ShaderNodeObject<Node>, ShaderNodeObject<Node>]>(([lightColor, intensity]) => {
    return lightColor.mul(intensity);
});
