import { useFBO } from '@react-three/drei';
import { PointsProps, createPortal, useFrame } from '@react-three/fiber';
import { useControls } from 'leva';
import { useMemo, useRef } from 'react';
import {
    AdditiveBlending,
    BufferGeometry,
    Color,
    DataTexture,
    FloatType,
    NearestFilter,
    OrthographicCamera,
    Points,
    RGBAFormat,
    Scene,
    ShaderMaterial,
    Vector3,
} from 'three';
import { v4 as uuidv4 } from 'uuid';
import fragmentShader from './shaders/fragment.glsl';
import simulationFragmentShader from './shaders/simulation-fragment.glsl';
import simulationVertexShader from './shaders/simulation-vertex.glsl';
import vertexShader from './shaders/vertex.glsl';

type Props = PointsProps & {
    particleGeometry: BufferGeometry;
};

const getRandomDataBox = (width: number, height: number) => {
    const len = width * height * 4;
    const data = new Float32Array(len);

    for (let i = 0; i < data.length; i++) {
        const stride = i * 4;

        data[stride] = (Math.random() - 0.5) * 0.2;
        data[stride + 1] = (Math.random() - 0.5) * 0.1;
        data[stride + 2] = (Math.random() - 0.5) * 2 + 0.8;
        data[stride + 3] = 1;
    }
    return data;
};

const getRandomDataFromModelPositions = (_geometry: BufferGeometry, width: number, height: number) => {
    const geometry = _geometry.clone();
    geometry.rotateX(-Math.PI / 2);
    const scale = 1.1;
    geometry.scale(scale, scale, 1);

    const length = width * height * 4;
    const data = new Float32Array(length);

    for (let i = 0; i < length; i++) {
        const stride = i * 4;

        const rand = Math.floor(Math.random() * geometry.attributes.position.array.length);
        const x = geometry.attributes.position.array[3 * rand];
        const y = geometry.attributes.position.array[3 * rand + 1];
        const z = geometry.attributes.position.array[3 * rand + 2] + Math.random() * 0.2 * 0;

        data[stride] = x;
        data[stride + 1] = y;
        data[stride + 2] = z;
        data[stride + 3] = 1;
    }

    return data;
};

const SwordParticles = ({ particleGeometry, ...props }: Props) => {
    const meshRef = useRef<Points<BufferGeometry, ShaderMaterial>>(null);
    const simulationMaterialRef = useRef<ShaderMaterial>(null);

    const { count, speed, color, particleSize } = useControls({
        count: {
            value: 75,
            min: 0,
            max: 100,
            step: 1,
        },
        particleSize: {
            value: 2,
            min: 0,
            max: 10,
            step: 1,
        },
        speed: {
            value: 0.07,
            min: 0,
            max: 1,
            step: 0.001,
        },
        color: '#ffaf38',
    });

    /**
     * Simulation
     */

    const scene = useMemo(() => new Scene(), []);
    const fboCamera = useMemo(() => new OrthographicCamera(-1, 1, 1, -1, 1 / Math.pow(2, 53), 1), []);
    const positions = useMemo(() => new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0]), []);
    const uvs = useMemo(() => new Float32Array([0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0]), []);

    const renderTarget = useFBO(count, count, {
        minFilter: NearestFilter,
        magFilter: NearestFilter,
        format: RGBAFormat,
        stencilBuffer: false,
        type: FloatType,
    });

    const positionsTexture = useMemo(() => {
        // const texture = new DataTexture(getRandomDataBox(count, count), count, count, RGBAFormat, FloatType);
        const texture = new DataTexture(
            getRandomDataFromModelPositions(particleGeometry, count, count),
            count,
            count,
            RGBAFormat,
            FloatType,
        );
        texture.needsUpdate = true;
        return texture;
    }, [count, particleGeometry]);

    const simulationUniforms = useMemo(
        () => ({
            uPositions: { value: positionsTexture },
            uTime: { value: 0 },
            uSpeed: { value: speed },
        }),
        [positionsTexture, speed],
    );

    /**
     * /Simulation
     */

    const particlesPosition = useMemo(() => {
        const length = count * count;
        const positions = new Float32Array(length * 3);

        for (let i = 0; i < length; i++) {
            const i3 = i * 3;
            positions[i3 + 0] = Math.random();
            positions[i3 + 1] = Math.random();
            positions[i3 + 2] = Math.random();
        }

        return positions;
    }, [count]);

    const uniforms = useMemo(
        () => ({
            uPositions: { value: null },
            uTime: { value: 0 },
            uSize: { value: particleSize },
            uColor: { value: new Color(color) },
        }),
        [color, particleSize],
    );

    useFrame(({ gl, clock }) => {
        const time = clock.getElapsedTime();

        gl.setRenderTarget(renderTarget);
        gl.clear();
        gl.render(scene, fboCamera);
        gl.setRenderTarget(null);

        simulationMaterialRef.current!.uniforms.uTime.value = time;

        meshRef.current!.material.uniforms.uPositions.value = renderTarget.texture;
        // meshRef.current!.material.uniforms.uTime.value = time;
    });

    return (
        <>
            {createPortal(
                <mesh>
                    <bufferGeometry>
                        <bufferAttribute
                            attach="attributes-position"
                            count={positions.length / 3}
                            array={positions}
                            itemSize={3}
                        />
                        <bufferAttribute attach="attributes-uv" count={uvs.length / 2} array={uvs} itemSize={2} />
                    </bufferGeometry>
                    <shaderMaterial
                        ref={simulationMaterialRef}
                        uniforms={simulationUniforms}
                        vertexShader={simulationVertexShader}
                        fragmentShader={simulationFragmentShader}
                    />
                </mesh>,
                scene,
            )}
            <points {...props} ref={meshRef}>
                <bufferGeometry>
                    <bufferAttribute
                        key={particlesPosition.length}
                        attach="attributes-position"
                        count={particlesPosition.length / 3}
                        array={particlesPosition}
                        itemSize={3}
                    />
                </bufferGeometry>
                <shaderMaterial
                    uniforms={uniforms}
                    vertexShader={vertexShader}
                    fragmentShader={fragmentShader}
                    depthWrite={false}
                    blending={AdditiveBlending}
                />
            </points>
        </>
    );
};

export default SwordParticles;
