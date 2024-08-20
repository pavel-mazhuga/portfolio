import { useFBO } from '@react-three/drei';
import { createPortal } from '@react-three/fiber';
import { useCallback, useMemo, useRef } from 'react';
import {
    BufferGeometry,
    DataTexture,
    FloatType,
    MathUtils,
    Mesh,
    NearestFilter,
    OrthographicCamera,
    RGBAFormat,
    Scene,
    ShaderMaterial,
    WebGLRenderer,
} from 'three';
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
        data[stride + 3] = 0.3 + Math.random() * 1.7; // speed multiplier
    }

    return data;
};

class SimulationMaterial extends ShaderMaterial {
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

function useGPGPU(size: number) {
    const simulationMeshRef = useRef<Mesh<BufferGeometry, ShaderMaterial>>(null);
    const scene = useMemo(() => new Scene(), []);
    const fboCamera = useMemo(() => new OrthographicCamera(-1, 1, 1, -1, 1 / Math.pow(2, 53), 1), []);
    const positions = useMemo(() => new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0]), []);
    const uvs = useMemo(() => new Float32Array([0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0]), []);
    const simulationMaterial = useMemo(() => new SimulationMaterial(size), [size]);

    const renderTarget = useFBO(size, size, {
        minFilter: NearestFilter,
        magFilter: NearestFilter,
        format: RGBAFormat,
        stencilBuffer: false,
        type: FloatType,
    });

    const renderOffscreen = useCallback(
        () =>
            createPortal(
                <mesh ref={simulationMeshRef} material={simulationMaterial}>
                    <bufferGeometry>
                        <bufferAttribute
                            attach="attributes-position"
                            count={positions.length / 3}
                            array={positions}
                            itemSize={3}
                        />
                        <bufferAttribute attach="attributes-uv" count={uvs.length / 2} array={uvs} itemSize={2} />
                    </bufferGeometry>
                </mesh>,
                scene,
            ),
        [positions, scene, simulationMaterial, uvs],
    );

    return {
        compute: (gl: WebGLRenderer) => {
            gl.setRenderTarget(renderTarget);
            gl.clear();
            gl.render(scene, fboCamera);
            gl.setRenderTarget(null);

            return renderTarget;
        },
        simulationMeshRef,
        renderOffscreen,
    };
}

export default useGPGPU;
