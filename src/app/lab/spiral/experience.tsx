'use client';

import { OrbitControls } from '@react-three/drei';
import { Canvas, MeshProps } from '@react-three/fiber';
import { v4 as uuidv4 } from 'uuid';
import { useMemo, useRef } from 'react';
import { Mesh, Vector3 } from 'three';
import ExperimentLayout from '../ExperimentLayout';
import vertexShader from './shaders/vertex.glsl';
import fragmentShader from './shaders/fragment.glsl';

const Spiral = (props: MeshProps) => {
    const mesh = useRef<Mesh>(null);

    const uniforms = useMemo(
        () => ({
            uRefractPower: { value: 0.4 },
            uLight: { value: new Vector3(-1, 1, 1) },
            uShininess: { value: 20 },
            uDiffuseness: { value: 0.3 },
            uFresnelPower: { value: 8 },
        }),
        [],
    );

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
                    <Spiral />
                    <OrbitControls />
                </Canvas>
            </div>
        </ExperimentLayout>
    );
};

export default Experience;
