'use client';

import { useRef } from 'react';
import { Mesh, PlaneGeometry, ShaderMaterial } from 'three';
import { v4 as uuidv4 } from 'uuid';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import ExperimentLayout from '../ExperimentLayout';
import vertexShader from './shaders/vertex.glsl';
import fragmentShader from './shaders/fragment.glsl';
import ExperimentBackground from '@/app/components/layout/WebGL/ExperimentBackground/ExperimentBackground';

const Experiment = () => {
    const mesh = useRef<Mesh<PlaneGeometry, ShaderMaterial>>(null);

    useFrame(({ clock }) => {
        mesh.current!.material.uniforms.uTime.value = clock.getElapsedTime();
    });

    return (
        <mesh ref={mesh}>
            <icosahedronGeometry args={[1.2, 64]} />
            <shaderMaterial
                key={uuidv4()}
                uniforms={{
                    uTime: { value: 0 },
                }}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                toneMapped={false}
            />
        </mesh>
    );
};

const Experience = () => {
    return (
        <ExperimentLayout sourceLink="https://github.com/pavel-mazhuga/portfolio/tree/main/src/app/lab/displaced-sphere">
            <div className="canvas-wrapper">
                <Canvas
                    camera={{
                        position: [0, 0, 5],
                        fov: 45,
                        near: 0.1,
                        far: 1000,
                    }}
                >
                    <ExperimentBackground />
                    <Experiment />
                    <OrbitControls />
                </Canvas>
            </div>
        </ExperimentLayout>
    );
};

export default Experience;