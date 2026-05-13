import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
    Fn,
    bitangentLocal,
    cos,
    cross,
    float,
    mix,
    modelWorldMatrix,
    mul,
    positionLocal,
    sin,
    smoothstep,
    tangentLocal,
    time,
    transformNormalToView,
    vec2,
    vec3,
    vec4,
} from 'three/tsl';
import { Mesh, MeshStandardNodeMaterial, Node, PlaneGeometry } from 'three/webgpu';
import { cnoise3d } from '../lib/nodes/noise/classicNoise3d';

class Water extends Mesh {
    material: MeshStandardNodeMaterial;

    static get geometry() {
        const geometry = mergeVertices(new PlaneGeometry(20, 20, 256, 256));

        geometry.rotateX(-Math.PI / 2);
        geometry.translate(0, 0, -5);
        geometry.computeTangents();

        return geometry;
    }

    constructor() {
        super();

        this.frustumCulled = false;
        this.geometry = Water.geometry;
        this.material = new MeshStandardNodeMaterial();

        const uWavesFrequency = vec2(0.5, 1.5);
        const uWavesSpeed = float(0.75);
        const uWavesElevation = float(0.2);

        const getWaveElevation = Fn(([position]: [Node<'vec3'>]) => {
            const posWorld = modelWorldMatrix.mul(position);
            const noise = cnoise3d(vec3(posWorld.xz, position.y)).toVar();
            const timeMult = time.mul(uWavesSpeed).toVar();

            return cos(posWorld.x.mul(uWavesFrequency.x).add(timeMult).add(noise))
                .mul(sin(posWorld.z.mul(uWavesFrequency.y).add(timeMult).add(noise)))
                .mul(uWavesElevation)
                .mul(noise);
        });

        /**
         * Position node
         */

        const displacement = getWaveElevation(positionLocal);
        const position = positionLocal.add(vec3(0, displacement, 0));

        this.material.positionNode = position;

        /**
         * Normal node
         */

        this.material.normalNode = Fn(() => {
            const normalComputeShift = float(0.015);

            // Neighbours
            let neighbourAPosition = positionLocal.add(mul(tangentLocal, normalComputeShift));
            let neighbourBPosition = positionLocal.add(
                mul(bitangentLocal as unknown as Node<'vec3'>, normalComputeShift),
            );

            const displacementA = getWaveElevation(neighbourAPosition);
            const displacementB = getWaveElevation(neighbourBPosition);

            neighbourAPosition = neighbourAPosition.add(vec3(0, displacementA, 0));
            neighbourBPosition = neighbourBPosition.add(vec3(0, displacementB, 0));

            const toA = neighbourAPosition.sub(position).normalize();
            const toB = neighbourBPosition.sub(position).normalize();
            const normal = cross(toA, toB);

            return transformNormalToView(normal);
        })();

        /**
         * Color node
         */

        this.material.colorNode = Fn(() => {
            const color = vec4(vec3(0.7), 1);

            color.rgb.assign(mix(vec3(0), color.rgb, smoothstep(-15, 0, positionLocal.z)));

            return color;
        })();
    }
}

export default Water;
