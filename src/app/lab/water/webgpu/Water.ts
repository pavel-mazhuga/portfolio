import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
    Fn,
    Mesh,
    MeshStandardNodeMaterial,
    PlaneGeometry,
    Scene,
    bitangentLocal,
    cameraPosition,
    cos,
    cross,
    float,
    mix,
    positionLocal,
    reflector,
    sin,
    smoothstep,
    tangentLocal,
    time,
    transformNormalToView,
    vec2,
    vec3,
    vec4,
} from 'three/webgpu';
import { cnoise3d } from '@/utils/webgpu/nodes/noise/classicNoise3d';

class Water extends Mesh {
    material: MeshStandardNodeMaterial;

    static get geometry() {
        const geometry = mergeVertices(new PlaneGeometry(20, 20, 128, 128));
        geometry.rotateX(-Math.PI / 2);
        geometry.translate(0, 0, -5);
        geometry.computeTangents();

        return geometry;
    }

    constructor(scene: Scene) {
        super();

        this.geometry = Water.geometry;
        this.material = new MeshStandardNodeMaterial();

        const uTime = time;

        const getWaveElevation = Fn<[any]>(([position]) => {
            const posWorld = position.add(cameraPosition);
            const uWavesFrequency = vec2(0.5, 1.5);
            const uWavesSpeed = float(0.75);
            const uWavesElevation = float(0.2);

            const noise = cnoise3d(vec3(posWorld.xz, position.y.mul(uTime))).toVar();
            const elevation = cos(posWorld.x.mul(uWavesFrequency.x).add(uTime.mul(uWavesSpeed)).add(noise))
                .mul(sin(posWorld.z.mul(uWavesFrequency.y).add(uTime.mul(uWavesSpeed)).add(noise)))
                .mul(uWavesElevation)
                .mul(noise);

            return elevation;
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

        const normalComputeShift = float(0.015);

        // Neighbours
        let neighbourAPosition = positionLocal.add(tangentLocal.xyz.mul(normalComputeShift));
        let neighbourBPosition = positionLocal.add(bitangentLocal.xyz.mul(normalComputeShift));

        const displacementA = getWaveElevation(neighbourAPosition);
        const displacementB = getWaveElevation(neighbourBPosition);

        neighbourAPosition = neighbourAPosition.add(vec3(0, displacementA, 0));
        neighbourBPosition = neighbourBPosition.add(vec3(0, displacementB, 0));

        const toA = neighbourAPosition.sub(position).normalize();
        const toB = neighbourBPosition.sub(position).normalize();
        const normal = cross(toA, toB);

        this.material.normalNode = transformNormalToView(normal);

        /**
         * Reflection node
         */

        const reflection = reflector({ resolution: 0.25 });
        reflection.target.rotateX(-Math.PI / 2);

        if (reflection.uvNode) {
            reflection.uvNode = reflection.uvNode.add(displacement).add(vec2(0, 0)); /* .add( floorNormalOffset ); */
        }
        scene.add(reflection.target);

        /**
         * Color node
         */

        this.material.colorNode = Fn(() => {
            const color = vec4(vec3(0.7), 1);
            color.rgb.assign(mix(vec3(0), color.rgb, smoothstep(-15, 0, positionLocal.z)));

            // color.mixAssign(color, reflection);
            color.addAssign(color, reflection);

            return color;
        })();
    }
}

export default Water;
