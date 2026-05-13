import { Fn, abs, float, sin, time, vec3 } from 'three/tsl';
import type { Node } from 'three/webgpu';

type PositionInputs = {
    position: Node<'vec3'>;
    progress: Node<'float'>;
    frequency: Node<'float'>;
    speed: Node<'float'>;
    amplitude: Node<'float'>;
};

export const positionNode = Fn((inputs: PositionInputs) => {
    const { position, progress, frequency, speed, amplitude } = inputs;

    const transformedProgress = abs(float(progress).mul(2).sub(1)).oneMinus();
    const newPos = vec3(position).toVar();

    newPos.z.addAssign(
        sin(newPos.x.mul(frequency).add(time.mul(speed)))
            .mul(amplitude)
            .mul(transformedProgress),
    );

    return newPos;
});
