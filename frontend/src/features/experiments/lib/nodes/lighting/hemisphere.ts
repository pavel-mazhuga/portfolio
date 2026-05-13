import { Fn, mix } from 'three/tsl';
import type { Node } from 'three/webgpu';

export const createHemisphereLight = Fn(
    ([normal, groundColor, skyColor]: [Node<'vec3'>, Node<'vec3'>, Node<'vec3'>]) => {
        const hemiMix = normal.y.mul(0.5).add(0.5);

        return mix(groundColor, skyColor, hemiMix);
    },
);
