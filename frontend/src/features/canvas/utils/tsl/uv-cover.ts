/* eslint-disable */
import { Fn, float, select, vec2 } from 'three/tsl';
import type { Node, NodeBuilder } from 'three/webgpu';

export const coverTextureUv = /*#__PURE__*/ Fn(
    (
        [imgSize_immutable, planeSize_immutable, ouv_immutable]: [Node<'vec2'>, Node<'vec2'>, Node<'vec2'>],
        _builder: NodeBuilder,
    ) => {
        const ouv = vec2(ouv_immutable).toVar();
        const planeSize = vec2(planeSize_immutable).toVar();
        const imgSize = vec2(imgSize_immutable).toVar();
        const s = vec2(planeSize).toVar();
        const i = vec2(imgSize).toVar();
        const rs = float(s.x.div(s.y)).toVar();
        const ri = float(i.x.div(i.y)).toVar();
        const coverWide = vec2(i.x.mul(s.y).div(i.y), s.y);
        const coverTall = vec2(s.x, i.y.mul(s.x).div(i.x));
        const coverPick = select(rs.lessThan(ri), coverWide, coverTall);
        const newUv = coverPick.toVar();
        const offsetPick = select(
            rs.lessThan(ri),
            vec2(newUv.x.sub(s.x).div(2.0), 0.0),
            vec2(0.0, newUv.y.sub(s.y).div(2.0)),
        );
        const offsetCenter = offsetPick.toVar();
        const offset = offsetCenter.div(newUv).toVar();

        return vec2(ouv.mul(s).div(newUv).add(offset)).toVar();
    },
).setLayout({
    name: 'coverTextureUv',
    type: 'vec2',
    inputs: [
        { name: 'imgSize', type: 'vec2' },
        { name: 'planeSize', type: 'vec2' },
        { name: 'ouv', type: 'vec2' },
    ],
});
