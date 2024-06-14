'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useControls } from 'leva';
import { Suspense, useMemo, useRef } from 'react';
import { AdditiveBlending, BufferGeometry, MathUtils, Points, ShaderMaterial, Vector2 } from 'three';
import { v4 as uuidv4 } from 'uuid';
import PageLoading from '@/app/components/shared/PageLoading';
import ExperimentLayout from '../ExperimentLayout';
import LevaWrapper from '../LevaWrapper';
import fragmentShader from './shaders/fragment.glsl';
import vertexShader from './shaders/vertex.glsl';

const Experiment = () => {
    const meshRef = useRef<Points<BufferGeometry, ShaderMaterial>>(null);

    const { count, radius, power, pointSize, speed } = useControls({
        count: {
            value: 30000,
            min: 0,
            max: 50000,
            step: 1,
        },
        radius: {
            value: 2.5,
            min: 0,
            max: 4,
            step: 0.001,
        },
        power: {
            value: 3,
            min: 1,
            max: 5,
            step: 0.001,
        },
        pointSize: {
            value: 3,
            min: 0,
            max: 10,
            step: 0.001,
        },
        speed: {
            value: 0.3,
            min: 0,
            max: 3,
            step: 0.001,
        },
    });

    const particlesPosition = useMemo(() => {
        const positions = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            const distance = Math.sqrt(Math.random()) * radius;
            const theta = MathUtils.randFloatSpread(360);
            const phi = MathUtils.randFloatSpread(360);

            let x = distance * Math.sin(theta) * Math.cos(phi);
            let y = distance * Math.sin(theta) * Math.sin(phi);
            let z = distance * Math.cos(theta);

            positions.set([x, y, z], i * 3);
        }

        return positions;
    }, [radius, count]);

    const uniforms = useMemo(
        () => ({
            uTime: { value: 0 },
            uPointSize: { value: pointSize },
            uRadius: { value: radius },
            uPointer: { value: new Vector2() },
            uPower: { value: power },
            uSpeed: { value: speed },
        }),
        [radius, power, pointSize, speed],
    );

    useFrame(({ clock, pointer }) => {
        meshRef.current!.material.uniforms.uTime.value = clock.getElapsedTime();
        meshRef.current!.material.uniforms.uPointer.value.x = pointer.x;
        meshRef.current!.material.uniforms.uPointer.value.y = pointer.y;
    });

    return (
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
                uniforms={uniforms}
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
        <ExperimentLayout sourceLink="https://github.com/pavel-mazhuga/portfolio/tree/main/src/app/lab/gpu-particles">
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
                </Canvas>
            </div>
        </ExperimentLayout>
    );
};

export default Experience;
