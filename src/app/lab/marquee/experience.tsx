'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { Suspense, useRef } from 'react';
import { Html, OrbitControls, useTexture } from '@react-three/drei';
import { DoubleSide, Mesh, PlaneGeometry, SRGBColorSpace, ShaderMaterial } from 'three';
import { v4 as uuidv4 } from 'uuid';
import ExperimentLayout from '../ExperimentLayout';
import vertexShader from './shaders/vertex.glsl';
import fragmentShader from './shaders/fragment.glsl';
// import textTexture from './text.png';

const Experiment = () => {
    const plane = useRef<Mesh<PlaneGeometry, ShaderMaterial>>(null);

    // const texture = useTexture(textTexture.src);
    const texture = useTexture(
        'https://images.unsplash.com/photo-1701122623529-57a0c47e4e0e?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    );
    texture.colorSpace = SRGBColorSpace;

    useFrame(({ clock }) => {
        plane.current!.material.uniforms.uTime.value = clock.getElapsedTime();
    });

    return (
        <>
            {/* <mesh ref={plane} scale={[0.0004, 0.0004, 0.0004]}>
                <planeGeometry args={[texture.image.naturalWidth, texture.image.naturalHeight]} />
                <shaderMaterial
                    key={uuidv4()}
                    uniforms={{
                        uMap: { value: texture },
                        uTime: { value: 0 },
                    }}
                    vertexShader={vertexShader}
                    fragmentShader={fragmentShader}
                    side={DoubleSide}
                />
            </mesh> */}
            <mesh ref={plane}>
                <sphereGeometry args={[1, 128, 128]} />
                <shaderMaterial
                    key={uuidv4()}
                    uniforms={{
                        uMap: { value: texture },
                        uTime: { value: 0 },
                    }}
                    vertexShader={vertexShader}
                    fragmentShader={fragmentShader}
                    side={DoubleSide}
                />
            </mesh>
        </>
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
                    gl={{ antialias: true, alpha: false }}
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

                    <OrbitControls />
                </Canvas>
            </div>
        </ExperimentLayout>
    );
};

export default Experience;