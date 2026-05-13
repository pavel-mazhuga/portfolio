import { Fn, ceil, dot, float, floor, fract, int, mix, mod, mul, sin, smoothstep, uv, vec2, vec4 } from 'three/tsl';
import type { Node } from 'three/webgpu';
import {
    HalfFloatType,
    MeshBasicNodeMaterial,
    NearestFilter,
    QuadMesh,
    RedFormat,
    RenderTarget,
    RepeatWrapping,
    Texture,
    WebGPURenderer,
} from 'three/webgpu';

const hash = /*#__PURE__*/ Fn(([p]: [Node<'vec2'>]) => {
    const pVar = vec2(p).toVar();

    pVar.assign(vec2(dot(pVar, vec2(127.1, 311.7)), dot(pVar, vec2(269.5, 183.3))));

    return fract(vec2(sin(pVar.x), sin(pVar.y)).mul(43758.5453123));
}).setLayout({
    name: 'hash',
    type: 'vec2',
    inputs: [{ name: 'p', type: 'vec2' }],
});

type ModuloInputs = { divident: Node<'vec2'>; divisor: Node<'vec2'> };

export const modulo = /*#__PURE__*/ Fn((params: ModuloInputs) => {
    const divisor = vec2(params.divisor).toVar();
    const divident = vec2(params.divident).toVar();
    const positiveDivident = vec2(mod(divident, divisor).add(divisor)).toVar();

    return mod(positiveDivident, divisor);
}).setLayout({
    name: 'modulo',
    type: 'vec2',
    inputs: [
        { name: 'divident', type: 'vec2' },
        { name: 'divisor', type: 'vec2' },
    ],
});

export const random = /*#__PURE__*/ Fn(([value]: [Node<'vec2'>]) => {
    const valueVar = vec2(value).toVar();

    valueVar.assign(vec2(dot(valueVar, vec2(127.1, 311.7)), dot(valueVar, vec2(269.5, 183.3))));

    return float(-1.0).add(mul(2.0, fract(sin(valueVar.x).mul(sin(valueVar.y)).mul(43758.5453123))));
}).setLayout({
    name: 'random',
    type: 'vec2',
    inputs: [{ name: 'value', type: 'vec2' }],
});

type PerlinInputs = {
    uv: Node<'vec2'>;
    cell_amount: Node<'float'> | number;
    period: Node<'vec2'>;
};

export const perlinNode = /*#__PURE__*/ Fn((params: PerlinInputs) => {
    const period = vec2(params.period).toVar();
    const cellAmount = (
        typeof params.cell_amount === 'number' ? float(params.cell_amount) : params.cell_amount
    ).toVar();
    const uvVar = vec2(params.uv).toVar();

    uvVar.assign(uvVar.mul(cellAmount));
    const cellsMinimum = vec2(floor(uvVar)).toVar();
    const cellsMaximum = vec2(ceil(uvVar)).toVar();
    const uvFract = vec2(fract(uvVar)).toVar();

    cellsMinimum.assign(modulo({ divident: cellsMinimum, divisor: period }));
    cellsMaximum.assign(modulo({ divident: cellsMaximum, divisor: period }));
    const blur = vec2(smoothstep(0.0, 1.0, uvFract.x), smoothstep(0.0, 1.0, uvFract.y)).toVar();
    const lowerLeftDirection = vec2(random(vec2(cellsMinimum.x, cellsMinimum.y))).toVar();
    const lowerRightDirection = vec2(random(vec2(cellsMaximum.x, cellsMinimum.y))).toVar();
    const upperLeftDirection = vec2(random(vec2(cellsMinimum.x, cellsMaximum.y))).toVar();
    const upperRightDirection = vec2(random(vec2(cellsMaximum.x, cellsMaximum.y))).toVar();
    const fraction = vec2(fract(uvVar)).toVar();

    return mix(
        mix(
            dot(lowerLeftDirection, fraction.sub(vec2(int(0), int(0)))),
            dot(lowerRightDirection, fraction.sub(vec2(int(1), int(0)))),
            blur.x,
        ),
        mix(
            dot(upperLeftDirection, fraction.sub(vec2(int(0), int(1)))),
            dot(upperRightDirection, fraction.sub(vec2(int(1), int(1)))),
            blur.x,
        ),
        blur.y,
    )
        .mul(0.8)
        .add(0.5);
}).setLayout({
    name: 'perlinNode',
    type: 'float',
    inputs: [
        { name: 'uv', type: 'vec2' },
        { name: 'cell_amount', type: 'float' },
        { name: 'period', type: 'vec2' },
    ],
});

export class Noises {
    voronoi!: Texture;
    perlin!: Texture;
    hash!: Texture;
    quadMesh: QuadMesh;
    resolution = 128;

    constructor(private renderer: WebGPURenderer) {
        this.quadMesh = new QuadMesh();

        this.setPerlin();
        this.setHash();
    }

    setPerlin() {
        const renderTarget = new RenderTarget(this.resolution, this.resolution, {
            depthBuffer: false,
            format: RedFormat,
            type: HalfFloatType,
        });

        this.perlin = renderTarget.texture;
        this.perlin.wrapS = RepeatWrapping;
        this.perlin.wrapT = RepeatWrapping;

        const material = new MeshBasicNodeMaterial();

        material.outputNode = vec4(
            perlinNode({ uv: uv(), cell_amount: 6.0, period: vec2(6.0, 6.0) }).remap(0.1, 0.9, 0.0, 1.0),
            hash(uv().mul(128).floor().div(128)).x,
            0,
            0,
        );

        this.quadMesh.material = material;
        this.renderer.setRenderTarget(renderTarget);
        this.quadMesh.render(this.renderer);
        this.renderer.setRenderTarget(null);
    }

    setHash() {
        const renderTarget = new RenderTarget(this.resolution, this.resolution, {
            depthBuffer: false,
            format: RedFormat,
            type: HalfFloatType,
        });

        this.hash = renderTarget.texture;
        this.hash.wrapS = RepeatWrapping;
        this.hash.wrapT = RepeatWrapping;
        this.hash.minFilter = NearestFilter;
        this.hash.magFilter = NearestFilter;
        this.hash.generateMipmaps = false;

        const material = new MeshBasicNodeMaterial();

        material.outputNode = vec4(hash(uv()).x, 0, 0, 0);

        this.quadMesh.material = material;
        this.renderer.setRenderTarget(renderTarget);
        this.quadMesh.render(this.renderer);
        this.renderer.setRenderTarget(null);
    }
}
