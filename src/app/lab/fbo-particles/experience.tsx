'use client';

import { Canvas, createPortal, extend, useFrame } from '@react-three/fiber';
import { Suspense, useMemo, useRef } from 'react';
import {
    AdditiveBlending,
    BufferGeometry,
    Color,
    FloatType,
    NearestFilter,
    OrthographicCamera,
    Points,
    RGBAFormat,
    Scene,
    ShaderMaterial,
} from 'three';
import { v4 as uuidv4 } from 'uuid';
import { useControls } from 'leva';
import { OrbitControls, useFBO } from '@react-three/drei';
import ExperimentLayout from '../ExperimentLayout';
import vertexShader from './shaders/vertex.glsl';
import fragmentShader from './shaders/fragment.glsl';
import PageLoading from '@/app/components/shared/PageLoading';
import LevaWrapper from '../LevaWrapper';
import { SimulationMaterial } from '@/app/lab/fbo-particles/SimulationMaterial';

extend({ SimulationMaterial });

const Experiment = () => {
    const meshRef = useRef<Points<BufferGeometry, ShaderMaterial>>(null);
    const simulationMaterialRef = useRef<SimulationMaterial>(null);

    const {
        count: size,
        frequency,
        speed,
        color,
    } = useControls({
        count: {
            value: 800,
            min: 0,
            max: 1000,
            step: 1,
        },
        frequency: {
            value: 0.2,
            min: 0,
            max: 1,
            step: 0.001,
        },
        speed: {
            value: 0.07,
            min: 0,
            max: 1,
            step: 0.001,
        },
        color: '#04080d',
    });

    const scene = new Scene();
    const fboCamera = new OrthographicCamera(-1, 1, 1, -1, 1 / Math.pow(2, 53), 1);
    const positions = new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0]);
    const uvs = new Float32Array([0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0]);

    const renderTarget = useFBO(size, size, {
        minFilter: NearestFilter,
        magFilter: NearestFilter,
        format: RGBAFormat,
        stencilBuffer: false,
        type: FloatType,
    });

    const particlesPosition = useMemo(() => {
        const length = size * size;
        const particles = new Float32Array(length * 3);

        for (let i = 0; i < length; i++) {
            let i3 = i * 3;
            particles[i3 + 0] = (i % size) / size;
            particles[i3 + 1] = i / size / size;
        }

        return particles;
    }, [size]);

    const uniforms = useMemo(
        () => ({
            uPositions: { value: null },
            uTime: { value: 0 },
            uColor: { value: new Color(color) },
        }),
        [color],
    );

    useFrame(({ gl, clock }) => {
        const time = clock.getElapsedTime();

        gl.setRenderTarget(renderTarget);
        gl.clear();
        gl.render(scene, fboCamera);
        gl.setRenderTarget(null);

        meshRef.current!.material.uniforms.uPositions.value = renderTarget.texture;
        meshRef.current!.material.uniforms.uTime.value = time;

        simulationMaterialRef.current!.uniforms.uTime.value = time;
    });

    return (
        <>
            {createPortal(
                <mesh>
                    <simulationMaterial ref={simulationMaterialRef} args={[size, frequency, speed]} />
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
            )}
            <points ref={meshRef}>
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
                    key={uuidv4()}
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

const Experience = () => {
    return (
        <ExperimentLayout sourceLink="https://github.com/pavel-mazhuga/portfolio/tree/main/src/app/lab/fbo-particles">
            <LevaWrapper />
            <div className="canvas-wrapper">
                <Canvas
                    camera={{
                        position: [0, 0, 3],
                        fov: 45,
                        near: 0.1,
                        far: 100,
                    }}
                    gl={{ alpha: false, antialias: false }}
                >
                    <Suspense fallback={<PageLoading />}>
                        <Experiment />
                    </Suspense>
                    <OrbitControls />
                </Canvas>
            </div>
        </ExperimentLayout>
    );
};

export default Experience;
