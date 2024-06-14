'use client';

import { OrbitControls, useTexture } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useRef } from 'react';
import { DoubleSide, Mesh, PlaneGeometry, SRGBColorSpace, ShaderMaterial } from 'three';
import { v4 as uuidv4 } from 'uuid';
import PageLoading from '@/app/components/shared/PageLoading';
import ExperimentLayout from '../ExperimentLayout';
import fragmentShader from './shaders/fragment.glsl';
import vertexShader from './shaders/vertex.glsl';

const Experiment = () => {
    const plane = useRef<Mesh<PlaneGeometry, ShaderMaterial>>(null);

    const texture = useTexture(
        'https://images.unsplash.com/photo-1701122623529-57a0c47e4e0e?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    );
    texture.colorSpace = SRGBColorSpace;

    useFrame(({ clock }) => {
        plane.current!.material.uniforms.uTime.value = clock.getElapsedTime();
    });

    return (
        <mesh ref={plane}>
            <sphereGeometry args={[0.5, 128, 128]} />
            <shaderMaterial
                uniforms={{
                    uMap: { value: texture },
                    uTime: { value: 0 },
                }}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                side={DoubleSide}
            />
        </mesh>
    );
};

const Experience = () => {
    return (
        <ExperimentLayout sourceLink="https://github.com/pavel-mazhuga/portfolio/tree/main/src/app/lab/sphere-infinite-uv">
            <div className="canvas-wrapper">
                <Canvas
                    camera={{
                        position: [0, 0, 1.8],
                        fov: 45,
                        near: 0.1,
                        far: 1000,
                    }}
                    gl={{ antialias: true, alpha: false }}
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
