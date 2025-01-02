import { Fn, ShaderNodeObject, mix } from 'three/tsl';
import { Node } from 'three/webgpu';

export const createHemisphereLight = Fn<ShaderNodeObject<Node>[]>(([normal, groundColor, skyColor]) => {
    const hemiMix = normal.y.mul(0.5).add(0.5);
    return mix(groundColor, skyColor, hemiMix);
});
