import { DataTexture, FloatType, MathUtils, RGBAFormat, ShaderMaterial } from 'three';
import SIMULATION_FRAGMENT_SHADER from './shaders/simulation/fragment.glsl?raw';
import SIMULATION_VERTEX_SHADER from './shaders/simulation/vertex.glsl?raw';

const getRandomDataSphere = (width: number, height: number) => {
    const texels = width * height;
    const data = new Float32Array(texels * 4);

    for (let i = 0; i < texels; i++) {
        const stride = i * 4;

        const distance = Math.sqrt(Math.random()) * 1.5;
        const theta = MathUtils.randFloatSpread(360);
        const phi = MathUtils.randFloatSpread(360);

        data[stride] = distance * Math.sin(theta) * Math.cos(phi);
        data[stride + 1] = distance * Math.cos(theta) * Math.cos(phi);
        data[stride + 2] = distance * Math.cos(theta);
        data[stride + 3] = 1.0;
    }

    return data;
};

const getRandomDataBox = (width: number, height: number) => {
    const texels = width * height;
    const data = new Float32Array(texels * 4);

    for (let i = 0; i < texels; i++) {
        const stride = i * 4;

        data[stride] = (Math.random() - 0.5) * 2.0;
        data[stride + 1] = (Math.random() - 0.5) * 2.0;
        data[stride + 2] = (Math.random() - 0.5) * 2.0;
        data[stride + 3] = 1.0;
    }

    return data;
};

export class SimulationMaterial extends ShaderMaterial {
    constructor(size: number, speed = 0.1, progress = 0) {
        const positionsTextureA = new DataTexture(getRandomDataSphere(size, size), size, size, RGBAFormat, FloatType);

        positionsTextureA.needsUpdate = true;

        const positionsTextureB = new DataTexture(getRandomDataBox(size, size), size, size, RGBAFormat, FloatType);

        positionsTextureB.needsUpdate = true;

        const simulationUniforms = {
            uPositionsA: { value: positionsTextureA },
            uPositionsB: { value: positionsTextureB },
            uTime: { value: 0 },
            uSpeed: { value: speed },
            uProgress: { value: progress },
        };

        super({
            uniforms: simulationUniforms,
            vertexShader: SIMULATION_VERTEX_SHADER,
            fragmentShader: SIMULATION_FRAGMENT_SHADER,
        });
    }
}
