import { BufferGeometry, DataTexture, FloatType, RGBAFormat, ShaderMaterial, Vector2, Vector3 } from 'three';
import simulationFragmentShader from './shaders/simulation-fragment.glsl';
import simulationVertexShader from './shaders/simulation-vertex.glsl';

let done = false;

const getRandomDataFromModelPositions = (geometry: BufferGeometry, width: number, height: number) => {
    if (!done) {
        geometry.computeBoundingBox();
        const offset = geometry.boundingBox!.getCenter(new Vector3());
        geometry.translate(-offset.x, -offset.y, -offset.z);
        geometry.rotateX(-Math.PI / 2);
        done = true;
    }

    const length = width * height * 4;
    const data = new Float32Array(length);

    for (let i = 0; i < length; i++) {
        const stride = i * 4;

        const rand = Math.floor(Math.random() * geometry.attributes.position.array.length);
        const x = geometry.attributes.position.array[3 * rand];
        const y = geometry.attributes.position.array[3 * rand + 1];
        const z = geometry.attributes.position.array[3 * rand + 2];

        data[stride] = x;
        data[stride + 1] = y;
        data[stride + 2] = z;
        data[stride + 3] = 1.0;
    }

    return data;
};

export class SimulationMaterial extends ShaderMaterial {
    constructor(geometry: BufferGeometry, size: number, speed = 0.1, power = 1, distribution = 1) {
        const positionsTexture = new DataTexture(
            getRandomDataFromModelPositions(geometry, size, size),
            size,
            size,
            RGBAFormat,
            FloatType,
        );
        positionsTexture.needsUpdate = true;

        const simulationUniforms = {
            uPositions: { value: positionsTexture },
            uTime: { value: 0 },
            uSpeed: { value: speed },
            uPower: { value: power },
            uDistribution: { value: distribution },
            uMouse: { value: new Vector2(-20, 0) },
        };

        super({
            uniforms: simulationUniforms,
            vertexShader: simulationVertexShader,
            fragmentShader: simulationFragmentShader,
        });
    }

    dispose() {
        super.dispose();
    }
}
