import { Fn, PI, ShaderNodeObject, atan, cos, float, pow, sin } from 'three/tsl';
import { Node } from 'three/webgpu';

export const smoothMod = Fn<ShaderNodeObject<Node>[]>(([axis, amp, rad]) => {
    const top = cos(PI.mul(axis.div(amp))).mul(sin(PI.mul(axis.div(amp))));
    const bottom = pow(sin(PI.mul(axis.div(amp))), 2).add(pow(rad, 2));
    const at = atan(top.div(bottom));

    return amp.mul(0.5).sub(float(1).div(PI).mul(at));
});
