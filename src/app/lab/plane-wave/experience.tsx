'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useRef } from 'react';
import { Html, useTexture } from '@react-three/drei';
import { Mesh, PlaneGeometry, ShaderMaterial, Vector2 } from 'three';
import { v4 as uuidv4 } from 'uuid';
import ExperimentLayout from '../ExperimentLayout';
import { degToRad } from 'three/src/math/MathUtils';
import vertexShader from './shaders/vertex.glsl';
import fragmentShader from './shaders/fragment.glsl';

const Experiment = () => {
    const plane = useRef<Mesh<PlaneGeometry, ShaderMaterial>>(null);

    const texture = useTexture(
        'https://images.unsplash.com/photo-1602826347632-fc49a8675be6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&w=2370',
    );

    useFrame(() => {
        plane.current!.material.uniforms.time.value += 5;
    });

    return (
        <mesh ref={plane}>
            <planeGeometry args={[1, 1, 64, 64]} />
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
                    <Suspense
                        fallback={
                            <Html center>
                                <p>Loading...</p>
                            </Html>
                        }
                    >
                        <Experiment />
                    </Suspense>
                </Canvas>
            </div>
        </ExperimentLayout>
    );
};

export default Experience;