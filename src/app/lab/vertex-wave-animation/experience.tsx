'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useRef } from 'react';
import { useTexture } from '@react-three/drei';
import { Mesh, PlaneGeometry, SRGBColorSpace, ShaderMaterial, Vector2 } from 'three';
import { useControls } from 'leva';
import { v4 as uuidv4 } from 'uuid';
import ExperimentLayout from '../ExperimentLayout';
import vertexShader from './shaders/vertex.glsl';
import fragmentShader from './shaders/fragment.glsl';
import PageLoading from '@/components/shared/PageLoading';

const Experiment = () => {
    const plane = useRef<Mesh<PlaneGeometry, ShaderMaterial>>(null);

    const texture = useTexture(
        'https://images.unsplash.com/photo-1592853598064-5a7fa150592c?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    );
    texture.colorSpace = SRGBColorSpace;

    const { progress, area } = useControls({
        progress: { value: 0, min: 0, max: 1, step: 0.001 },
        area: { value: 5, min: 0, max: 20, step: 0.001 },
    });

    useFrame(() => {
        plane.current!.material.uniforms.uTime.value += 5;
        plane.current!.material.uniforms.uRadius.value = area;
        plane.current!.material.uniforms.uProgress.value = progress;
    });

    return (
        <mesh ref={plane} rotation={[-Math.PI / 3, 0, 0]} scale={[1.4, 1.4, 1.4]}>
            <planeGeometry args={[1, 1, 256, 256]} />
            <shaderMaterial
                key={uuidv4()}
                uniforms={{
                    image: { value: texture },
                    sizeImage: {
                        value: new Vector2(texture.image.naturalWidth, texture.image.naturalHeight),
                    },
                    planeSize: {
                        value: new Vector2(1, 1),
                    },
                    uTime: { value: 0 },
                    uProgress: { value: progress },
                    uRadius: { value: area },
                }}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
            />
        </mesh>
    );
};

const Experience = () => {
    return (
        <ExperimentLayout>
            <div className="canvas-wrapper">
                <Canvas
                    camera={{
                        position: [0, 0, 1.8],
                        fov: 45,
                        near: 0.1,
                        far: 100,
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
