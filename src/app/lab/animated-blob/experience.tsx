'use client';

import { OrbitControls, useTexture } from '@react-three/drei';
import { Canvas, MeshProps, extend, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import { IcosahedronGeometry, Mesh, ShaderMaterial } from 'three';
import { v4 as uuidv4 } from 'uuid';
import glowyImg from '@/../public/img/glowy.png';
import ExperimentLayout from '../ExperimentLayout';
import NoiseMatCapMaterial from './noise-matcap-material';

type NoiseSphereProps = MeshProps & {
    frequency: number;
    amplitude: number;
    radius: number;
    offset?: number;
};

extend({ NoiseMatCapMaterial });

const NoiseSphere = ({ frequency, amplitude, radius, offset = 0, ...props }: NoiseSphereProps) => {
    const sphere = useRef<Mesh<IcosahedronGeometry, ShaderMaterial>>(null);
    const texture = useTexture(glowyImg.src);

    useFrame((state) => {
        const time = state.clock.elapsedTime;

        if (sphere.current) {
            sphere.current.material.uniforms.u_amplitude.value = amplitude;
            sphere.current.material.uniforms.u_frequency.value = frequency;
            sphere.current.material.uniforms.u_time.value = time;
        }
    });

    return (
        <mesh ref={sphere} {...props}>
            <icosahedronGeometry args={[radius, 60]} />
            <noiseMatCapMaterial attach="material" args={[texture, offset]} />
        </mesh>
    );
};

const Experience = () => {
    const radius = 1;

    return (
        <ExperimentLayout sourceLink="https://github.com/pavel-mazhuga/portfolio/tree/main/src/app/lab/animated-blob">
            <div className="canvas-wrapper">
                <Canvas
                    camera={{
                        position: [0, 0, 5],
                        fov: 45,
                        near: 0.1,
                        far: 1000,
                    }}
                >
                    <NoiseSphere frequency={2} amplitude={0.7} radius={radius} />
                    <OrbitControls />
                </Canvas>
            </div>
        </ExperimentLayout>
    );
};

export default Experience;
