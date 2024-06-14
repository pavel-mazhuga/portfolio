'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef } from 'react';
import { AdditiveBlending, Color, PlaneGeometry, Points, ShaderMaterial, Vector2 } from 'three';
import { v4 as uuidv4 } from 'uuid';
import ExperimentLayout from '../ExperimentLayout';
import PageLoading from '@/app/components/shared/PageLoading';
import vertexShader from './shaders/vertex.glsl';
import fragmentShader from './shaders/fragment.glsl';
import { useControls } from 'leva';
import LevaWrapper from '../LevaWrapper';
import { OrbitControls } from '@react-three/drei';

const Experiment = () => {
    const plane = useRef<Points<PlaneGeometry, ShaderMaterial>>(null);
    const size = useThree((state) => state.size);

    const { count, pointSize, speed, color } = useControls({
        count: {
            value: 3000,
            min: 0,
            max: 10000,
            step: 1,
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
        color: '#80e5ff',
    });

    const particlesPosition = useMemo(() => {
        const positions = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            let x = (Math.random() - 0.5) * 0.2;
            let y = Math.random() - 0.5;
            let z = 0;

            positions.set([x, y, z], i * 3);
        }

        return positions;
    }, [count]);

    const particlesSizes = useMemo(() => {
        const sizes = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            let size = 0.5 + Math.random() * 0.5;
            sizes.set([size], i);
        }

        return sizes;
    }, [count]);

    useEffect(() => {
        plane.current!.material.uniforms.uResolution.value.x = size.width;
        plane.current!.material.uniforms.uResolution.value.y = size.height;
    }, [size.width, size.height]);

    useFrame(({ clock }) => {
        plane.current!.material.uniforms.uTime.value = clock.getElapsedTime();
    });

    return (
        <points ref={plane}>
            <bufferGeometry>
                <bufferAttribute
                    key={particlesPosition.length}
                    attach="attributes-position"
                    count={particlesPosition.length / 3}
                    array={particlesPosition}
                    itemSize={3}
                />
                <bufferAttribute
                    key={particlesSizes.length}
                    attach="attributes-aSize"
                    count={particlesSizes.length}
                    array={particlesSizes}
                    itemSize={1}
                />
            </bufferGeometry>
            <shaderMaterial
                key={uuidv4()}
                uniforms={{
                    uTime: { value: 0 },
                    uResolution: { value: new Vector2(size.width, size.height) },
                    uPointSize: { value: pointSize },
                    uColor: { value: new Color(color) },
                }}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                depthWrite={false}
                blending={AdditiveBlending}
                transparent
            />
        </points>
    );
};

const Experience = () => {
    return (
        <ExperimentLayout sourceLink="https://github.com/pavel-mazhuga/portfolio/tree/main/src/app/lab/particles-twist">
            <LevaWrapper />
            <div className="canvas-wrapper">
                <Canvas
                    camera={{
                        position: [0, 0, 2],
                        fov: 45,
                        near: 0.1,
                        far: 1000,
                    }}
                    gl={{ alpha: false }}
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
