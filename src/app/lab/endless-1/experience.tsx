'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useRef } from 'react';
import { ScreenQuad } from '@react-three/drei';
import { Mesh, PlaneGeometry, ShaderMaterial, Vector2 } from 'three';
import { v4 as uuidv4 } from 'uuid';
import ExperimentLayout from '../ExperimentLayout';
import vertexShader from './shaders/vertex.glsl';
import fragmentShader from './shaders/fragment.glsl';
import PageLoading from '@/app/components/shared/PageLoading';

const Experiment = () => {
    const plane = useRef<Mesh<PlaneGeometry, ShaderMaterial>>(null);
    const size = useThree((state) => state.size);

    useEffect(() => {
        plane.current!.material.uniforms.uResolution.value.x = size.width;
        plane.current!.material.uniforms.uResolution.value.y = size.height;
    }, [size.width, size.height]);

    useFrame(({ clock }) => {
        plane.current!.material.uniforms.uTime.value = clock.getElapsedTime();
    });

    return (
        <ScreenQuad ref={plane}>
            <shaderMaterial
                key={uuidv4()}
                uniforms={{
                    uTime: { value: 0 },
                    uResolution: { value: new Vector2(size.width, size.height) },
                }}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
            />
        </ScreenQuad>
    );
};

const Experience = () => {
    return (
        <ExperimentLayout sourceLink="https://github.com/pavel-mazhuga/portfolio/tree/main/src/app/lab/endless-1">
            <div className="canvas-wrapper">
                <Canvas
                    camera={{
                        position: [0, 0, 1],
                        fov: 45,
                        near: 0.1,
                        far: 100,
                    }}
                    gl={{ alpha: false }}
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
