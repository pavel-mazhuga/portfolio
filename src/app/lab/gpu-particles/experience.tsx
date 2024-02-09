'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useMemo, useRef } from 'react';
import { AdditiveBlending, BufferGeometry, MathUtils, Points, ShaderMaterial } from 'three';
import { v4 as uuidv4 } from 'uuid';
import ExperimentLayout from '../ExperimentLayout';
import vertexShader from './shaders/vertex.glsl';
import fragmentShader from './shaders/fragment.glsl';
import PageLoading from '@/app/components/shared/PageLoading';

const COUNT = 10000;

const Experiment = () => {
    const meshRef = useRef<Points<BufferGeometry, ShaderMaterial>>(null);
    const radius = 2.5;

    const particlesPosition = useMemo(() => {
        const positions = new Float32Array(COUNT * 3);

        for (let i = 0; i < COUNT; i++) {
            const distance = Math.sqrt(Math.random()) * radius;
            const theta = MathUtils.randFloatSpread(360);
            const phi = MathUtils.randFloatSpread(360);

            let x = distance * Math.sin(theta) * Math.cos(phi);
            let y = distance * Math.sin(theta) * Math.sin(phi);
            let z = distance * Math.cos(theta);

            positions.set([x, y, z], i * 3);
        }

        return positions;
    }, []);

    useFrame(({ clock }) => {
        meshRef.current!.material.uniforms.uTime.value = clock.getElapsedTime();
    });

    return (
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
                uniforms={{
                    uTime: { value: 0 },
                    uPointSize: { value: 3 },
                    uRadius: { value: radius },
                }}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                depthWrite={false}
                blending={AdditiveBlending}
            />
        </points>
    );
};

const Experience = () => {
    return (
        <ExperimentLayout>
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
                </Canvas>
            </div>
        </ExperimentLayout>
    );
};

export default Experience;
