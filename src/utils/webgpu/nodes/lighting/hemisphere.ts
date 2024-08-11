import { Node, ShaderNodeObject, mix, tslFn } from 'three/webgpu';

export const createHemisphereLight = tslFn<ShaderNodeObject<Node>[]>(([normal, groundColor, skyColor]) => {
    const hemiMix = normal.y.mul(0.5).add(0.5);
    return mix(groundColor, skyColor, hemiMix);
});
