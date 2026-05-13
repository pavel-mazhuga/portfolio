import { DataTexture, FloatType, MathUtils, RGBAFormat, ShaderMaterial } from 'three';
import SIMULATION_FRAGMENT_SHADER from './shaders/simulation/fragment.glsl?raw';
import SIMULATION_VERTEX_SHADER from './shaders/simulation/vertex.glsl?raw';

function generatePositions(width: number, height: number) {
    const count = width * height;
    const data = new Float32Array(count * 4);

    for (let i = 0; i < count; i++) {
        const stride = i * 4;
        const distance = Math.sqrt(Math.random()) * 2;
        const theta = MathUtils.randFloatSpread(360);
        const phi = MathUtils.randFloatSpread(360);

        data[stride] = distance * Math.sin(theta) * Math.cos(phi);
        data[stride + 1] = distance * Math.sin(theta) * Math.sin(phi);
        data[stride + 2] = distance * Math.cos(theta);
        data[stride + 3] = 0.3 + Math.random() * 1.7;
    }

    return data;
}

export class SimulationMaterial extends ShaderMaterial {
    constructor(size: number, frequency = 0.2, speed = 0.07) {
        const positionsTexture = new DataTexture(generatePositions(size, size), size, size, RGBAFormat, FloatType);

        positionsTexture.needsUpdate = true;

        super({
            uniforms: {
                uPositions: { value: positionsTexture },
                uTime: { value: 0 },
                uSpeed: { value: speed },
                uFrequency: { value: frequency },
            },
            vertexShader: SIMULATION_VERTEX_SHADER,
            fragmentShader: SIMULATION_FRAGMENT_SHADER,
        });
    }

    dispose(): void {
        const tex = this.uniforms.uPositions?.value as DataTexture | undefined;

        tex?.dispose();
        super.dispose();
    }
}
