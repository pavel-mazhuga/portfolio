import { Fn, ShaderNodeObject, abs, float, sin, time, vec3 } from 'three/tsl';
import { Node } from 'three/webgpu';

type Params = {
    position: ShaderNodeObject<Node>;
    progress: ShaderNodeObject<Node> | number;
    frequency: ShaderNodeObject<Node> | number;
    speed: ShaderNodeObject<Node> | number;
    amplitude: ShaderNodeObject<Node> | number;
};

export const positionNode = Fn<Params>(({ position, progress, frequency, speed, amplitude }) => {
    const transformedProgress = abs(float(progress).mul(2).sub(1)).oneMinus();
    const newPos = vec3(position).toVar();

    newPos.z.addAssign(
        sin(newPos.x.mul(frequency).add(time.mul(speed)))
            .mul(amplitude)
            .mul(transformedProgress),
    );

    return newPos;
});
