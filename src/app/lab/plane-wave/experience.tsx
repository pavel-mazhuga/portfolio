'use client';

import { useTexture } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useRef } from 'react';
import { Mesh, PlaneGeometry, SRGBColorSpace, ShaderMaterial, Vector2 } from 'three';
import { degToRad } from 'three/src/math/MathUtils.js';
import PageLoading from '@/app/components/shared/PageLoading';
import ExperimentLayout from '../ExperimentLayout';
import fragmentShader from './shaders/fragment.glsl';
import vertexShader from './shaders/vertex.glsl';

const Experiment = () => {
    const plane = useRef<Mesh<PlaneGeometry, ShaderMaterial>>(null);

    const texture = useTexture(
        'https://images.unsplash.com/photo-1602826347632-fc49a8675be6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&w=2370',
    );
    texture.colorSpace = SRGBColorSpace;

    useFrame(() => {
        plane.current!.material.uniforms.time.value += 5;
    });

    return (
        <mesh ref={plane}>
            <planeGeometry args={[1, 1, 64, 64]} />
            <shaderMaterial
                uniforms={{
                    image: { value: texture },
                    sizeImage: {
                        value: new Vector2(texture.image.naturalWidth, texture.image.naturalHeight),
                    },
                    planeSize: {
                        value: new Vector2(1, 1),
                    },
                    rotation: { value: degToRad(6.27) },
                    amp: { value: 0.14 },
                    time: { value: 0 },
                }}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
            />
        </mesh>
    );
};

const Experience = () => {
    return (
        <ExperimentLayout sourceLink="https://github.com/pavel-mazhuga/portfolio/tree/main/src/app/lab/plane-wave">
            <div className="canvas-wrapper">
                <Canvas
                    camera={{
                        position: [0, 0, 1.8],
                        fov: 45,
                        near: 0.1,
                        far: 1000,
                    }}
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
