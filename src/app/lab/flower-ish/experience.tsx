'use client';

import { OrbitControls } from '@react-three/drei';
import { Canvas, MeshProps, useFrame } from '@react-three/fiber';
import { v4 as uuidv4 } from 'uuid';
import { useMemo, useRef } from 'react';
import { BufferGeometry, Mesh, ShaderMaterial, Vector3 } from 'three';
import ExperimentLayout from '../ExperimentLayout';
import vertexShader from './shaders/vertex.glsl';
import fragmentShader from './shaders/fragment.glsl';

const Flower = (props: MeshProps) => {
    const mesh = useRef<Mesh<BufferGeometry, ShaderMaterial>>(null);

    const uniforms = useMemo(
        () => ({
            uTime: { value: 0.4 },
        }),
        [],
    );

    useFrame(({ clock }) => {
        const time = clock.getElapsedTime();

        if (mesh.current) {
            mesh.current.material.uniforms.uTime.value = time;
            mesh.current.rotation.z = time * 0.2;
        }
    });

    return (
        <mesh {...props} ref={mesh}>
            <torusGeometry args={[1, 0.55, 128, 256]} />
            <shaderMaterial
                key={uuidv4()}
                uniforms={uniforms}
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
                        position: [0, 0, 5],
                        fov: 45,
                        near: 0.1,
                        far: 100,
                    }}
                >
                    <Flower />
                    <OrbitControls />
                </Canvas>
            </div>
        </ExperimentLayout>
    );
};

export default Experience;
