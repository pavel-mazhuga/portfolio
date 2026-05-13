import { Fn } from 'three/tsl';
import type { Node } from 'three/webgpu';

export const ambientLightNode = Fn(([lightColor, intensity]: [Node<'vec3'>, Node<'float'>]) => {
    return lightColor.mul(intensity);
});
