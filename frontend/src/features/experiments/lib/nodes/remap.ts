/* eslint-disable */
import { Fn, clamp } from 'three/tsl';
import type { Node, NodeBuilder } from 'three/webgpu';

export const remapNode = Fn(
    (
        [value, in_min, in_max, out_min, out_max]: [
            Node<'float'>,
            Node<'float'>,
            Node<'float'>,
            Node<'float'>,
            Node<'float'>,
        ],
        _builder: NodeBuilder,
    ) => {
        const mapped = value.sub(in_min).mul(out_max.sub(out_min)).div(in_max.sub(in_min)).add(out_min);

        return clamp(mapped, out_min, out_max);
    },
);
