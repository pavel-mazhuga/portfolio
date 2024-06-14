import { DataTexture, FloatType, MathUtils, RGBAFormat, ShaderMaterial } from 'three';
import simulationFragmentShader from './shaders/simulation-fragment.glsl';
import simulationVertexShader from './shaders/simulation-vertex.glsl';

const generatePositions = (width: number, height: number) => {
    const length = width * height * 4;
    const data = new Float32Array(length);

    for (let i = 0; i < length; i++) {
        const stride = i * 4;

        const distance = Math.sqrt(Math.random()) * 2;
        const theta = MathUtils.randFloatSpread(360);
        const phi = MathUtils.randFloatSpread(360);

        data[stride] = distance * Math.sin(theta) * Math.cos(phi);
        data[stride + 1] = distance * Math.sin(theta) * Math.sin(phi);
        data[stride + 2] = distance * Math.cos(theta);
        data[stride + 3] = 1.0;
    }

    return data;
};

export class SimulationMaterial extends ShaderMaterial {
    constructor(size: number, frequency = 0.2, speed = 0.1) {
        const positionsTexture = new DataTexture(generatePositions(size, size), size, size, RGBAFormat, FloatType);
        positionsTexture.needsUpdate = true;

        const simulationUniforms = {
            uPositions: { value: positionsTexture },
            uTime: { value: 0 },
            uSpeed: { value: speed },
            uFrequency: { value: frequency },
        };

        super({
            uniforms: simulationUniforms,
            vertexShader: simulationVertexShader,
            fragmentShader: simulationFragmentShader,
        });
    }
}
