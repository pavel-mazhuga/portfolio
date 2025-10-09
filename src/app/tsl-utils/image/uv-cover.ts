// @ts-nocheck
// Three.js Transpiler r171
import { Fn, float, select, uv, vec2 } from 'three/tsl';

export const coverTextureUv = /*#__PURE__*/ Fn<
    [ShaderNodeObject<Node>, ShaderNodeObject<Node>, ShaderNodeObject<Node>]
>(([imgSize_immutable, planeSize_immutable, ouv_immutable]) => {
    const ouv = vec2(ouv_immutable).toVar();
    const planeSize = vec2(planeSize_immutable).toVar();
    const imgSize = vec2(imgSize_immutable).toVar();
    const s = vec2(planeSize).toVar();
    const i = vec2(imgSize).toVar();
    const rs = float(s.x.div(s.y)).toVar();
    const ri = float(i.x.div(i.y)).toVar();
    const newUv = vec2(
        select(rs.lessThan(ri), vec2(i.x.mul(s.y).div(i.y), s.y), vec2(s.x, i.y.mul(s.x).div(i.x))),
    ).toVar();
    const offset = vec2(
        select(rs.lessThan(ri), vec2(newUv.x.sub(s.x).div(2.0), 0.0), vec2(0.0, newUv.y.sub(s.y).div(2.0))).div(newUv),
    ).toVar();
    const uv = vec2(ouv.mul(s).div(newUv).add(offset)).toVar();

    return uv;
}).setLayout({
    name: 'coverTextureUv',
    type: 'vec2',
    inputs: [
        { name: 'imgSize', type: 'vec2' },
        { name: 'planeSize', type: 'vec2' },
        { name: 'ouv', type: 'vec2' },
    ],
});
