import { useFBO } from '@react-three/drei';
import { createPortal } from '@react-three/fiber';
import { useCallback, useMemo, useRef } from 'react';
import {
    BufferGeometry,
    DataTexture,
    FloatType,
    Mesh,
    NearestFilter,
    OrthographicCamera,
    RGBAFormat,
    Scene,
    ShaderMaterial,
    Spherical,
    Vector2,
    Vector3,
    WebGLRenderer,
} from 'three';
import simulationFragmentShader from './shaders/positions/fragment.glsl';
import simulationVertexShader from './shaders/positions/vertex.glsl';

const generatePositions = (width: number, height: number) => {
    const length = width * height * 4;
    const data = new Float32Array(length);

    for (let i = 0; i < length; i++) {
        const stride = i * 4;

        const spherical = new Spherical(0.4, Math.random() * Math.PI, Math.random() * Math.PI * 2);
        const vector = new Vector3().setFromSpherical(spherical);

        data[stride] = vector.x * Math.random();
        data[stride + 1] = vector.y * Math.random();
        data[stride + 2] = vector.z * Math.random();
        data[stride + 3] = 0;
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
            uPointer: { value: new Vector2() },
        };

        super({
            uniforms: simulationUniforms,
            vertexShader: simulationVertexShader,
            fragmentShader: simulationFragmentShader,
        });
    }
}

function useGPGPUPositions(size: number) {
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

    const particlesKoefs = useMemo(() => {
        const length = size * size;
        const koefs = new Float32Array(length);

        for (let i = 0; i < length; i++) {
            koefs[i] = Math.random();
        }

        return koefs;
    }, [size]);

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
                        <bufferAttribute
                            attach="attributes-aKoef"
                            count={particlesKoefs.length}
                            array={particlesKoefs}
                            itemSize={1}
                        />
                    </bufferGeometry>
                </mesh>,
                scene,
            ),
        [positions, scene, simulationMaterial, uvs, particlesKoefs],
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

export default useGPGPUPositions;
