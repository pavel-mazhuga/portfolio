'use client';

import { OrbitControls } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useControls } from 'leva';
import { Suspense, useMemo, useRef } from 'react';
import { AdditiveBlending, BufferGeometry, Color, Points, ShaderMaterial } from 'three';
import { v4 as uuidv4 } from 'uuid';
import PageLoading from '@/app/components/shared/PageLoading';
import ExperimentLayout from '../ExperimentLayout';
import LevaWrapper from '../LevaWrapper';
import fragmentShader from './shaders/fragment.glsl';
import vertexShader from './shaders/vertex.glsl';
import useGPGPU from './useGPGPU';

const Experiment = () => {
    const meshRef = useRef<Points<BufferGeometry, ShaderMaterial>>(null);

    const { count: size } = useControls({
        count: {
            value: 500,
            min: 0,
            max: 1000,
            step: 1,
        },
        frequency: {
            value: 0.2,
            min: 0,
            max: 1,
            step: 0.001,
            onChange: (val: number) => {
                if (simulationMeshRef.current) {
                    simulationMeshRef.current.material.uniforms.uFrequency.value = val;
                }
            },
        },
        speed: {
            value: 0.07,
            min: 0,
            max: 1,
            step: 0.001,
            onChange: (val: number) => {
                if (simulationMeshRef.current) {
                    simulationMeshRef.current.material.uniforms.uSpeed.value = val;
                }
            },
        },
        color: {
            value: '#1c2631',
            onChange: (val: string) => {
                if (meshRef.current) {
                    meshRef.current.material.uniforms.uColor.value.set(val);
                }
            },
        },
    });

    const { renderOffscreen, compute, simulationMeshRef } = useGPGPU(size);

    const particlesPosition = useMemo(() => {
        const length = size * size;
        const particles = new Float32Array(length * 3);

        for (let i = 0; i < length; i++) {
            let i3 = i * 3;
            particles[i3 + 0] = (i % size) / size;
            particles[i3 + 1] = i / size / size;
            particles[i3 + 2] = 0;
        }

        return particles;
    }, [size]);

    const uniforms = useMemo(
        () => ({
            uPositions: { value: null },
            uTime: { value: 0 },
            uColor: { value: new Color('#04080d') },
        }),
        [],
    );

    useFrame(({ gl, clock }) => {
        const time = clock.getElapsedTime();

        const renderTarget = compute(gl);

        meshRef.current!.material.uniforms.uPositions.value = renderTarget.texture;
        meshRef.current!.material.uniforms.uTime.value = time;

        if (simulationMeshRef.current) {
            simulationMeshRef.current.material.uniforms.uTime.value = time;
        }
    });

    return (
        <>
            {renderOffscreen()}
            <points ref={meshRef}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        count={particlesPosition.length / 3}
                        array={particlesPosition}
                        itemSize={3}
                    />
                </bufferGeometry>
                <shaderMaterial
                    key={process.env.NODE_ENV === 'development' ? uuidv4() : undefined}
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
                        far: 1000,
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
