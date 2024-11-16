'use client';

import { ComputedAttribute, OrbitControls } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useControls } from 'leva';
import { Suspense, useEffect, useRef } from 'react';
import { AdditiveBlending, BufferAttribute, Color, PlaneGeometry, Points, ShaderMaterial, Vector2 } from 'three';
import { v4 as uuidv4 } from 'uuid';
import PageLoading from '@/app/components/shared/PageLoading';
import Perf from '@/app/components/webgl/Perf';
import ExperimentLayout from '../ExperimentLayout';
import LevaWrapper from '../LevaWrapper';
import fragmentShader from './shaders/fragment.glsl';
import vertexShader from './shaders/vertex.glsl';
import useGPGPUPositions from './useGPGPUPositions';

const Experiment = () => {
    const plane = useRef<Points<PlaneGeometry, ShaderMaterial>>(null);
    const prevTime = useRef(0);
    const viewport = useThree((state) => state.viewport);

    const { count } = useControls({
        count: {
            value: 25000,
            min: 0,
            max: 50000,
            step: 1,
        },
        pointSize: {
            value: 20,
            min: 0,
            max: 50,
            step: 0.001,
            onChange: (val: number) => {
                if (plane.current) {
                    plane.current.material.uniforms.uPointSize.value = val;
                }
            },
        },
        color: {
            value: '#ff6730',
            onChange: (val: string) => {
                if (plane.current) {
                    plane.current.material.uniforms.uColor.value.set(val);
                }
            },
        },
    });

    const { gpgpuRenderer, data } = useGPGPUPositions(count);

    useEffect(() => {
        if (plane.current) {
            plane.current.material.uniforms.uResolution.value.x = viewport.width;
            plane.current.material.uniforms.uResolution.value.y = viewport.height;
        }
    }, [viewport.width, viewport.height]);

    useFrame(({ clock }) => {
        const elapsedTime = clock.getElapsedTime();
        const deltaTime = Math.min(elapsedTime - prevTime.current, 1 / 30);

        data.positions.variables.positionsVariable.material.uniforms.uTime.value = elapsedTime;
        data.positions.variables.positionsVariable.material.uniforms.uDeltaTime.value = deltaTime;

        gpgpuRenderer.compute();

        if (plane.current) {
            plane.current.material.uniforms.uPositions.value = gpgpuRenderer.getCurrentRenderTarget(
                data.positions.variables.positionsVariable,
            ).texture;
            plane.current.material.uniforms.uTime.value = elapsedTime;
            plane.current.material.uniforms.uDeltaTime.value = deltaTime;
        }

        prevTime.current = elapsedTime;
    });

    return (
        <points ref={plane}>
            <bufferGeometry drawRange={{ start: 0, count }}>
                <ComputedAttribute
                    key={`size-${count}`}
                    name="aSize"
                    compute={() => {
                        const sizes = new Float32Array(count);

                        for (let i = 0; i < count; i++) {
                            const size = 0.5 + Math.random() * 0.5;
                            sizes[i] = size;
                        }

                        return new BufferAttribute(sizes, 1);
                    }}
                />
                <ComputedAttribute
                    key={`uv-${count}`}
                    name="aParticleUv"
                    compute={() => {
                        const uvArray = new Float32Array(count * 2);
                        const size = Math.ceil(Math.sqrt(count));

                        for (let x = 0; x < size; x++) {
                            for (let y = 0; y < size; y++) {
                                const i = x * size + y;
                                const i2 = i * 2;

                                uvArray[i2 + 0] = (y + 0.5) / size;
                                uvArray[i2 + 1] = (x + 0.5) / size;
                            }
                        }

                        return new BufferAttribute(uvArray, 2);
                    }}
                />
            </bufferGeometry>
            <shaderMaterial
                key={process.env.NODE_ENV === 'development' ? uuidv4() : undefined}
                uniforms={{
                    uTime: { value: 0 },
                    uDeltaTime: { value: 0 },
                    uResolution: { value: new Vector2(viewport.width, viewport.height) },
                    uPointSize: { value: 20 },
                    uColor: { value: new Color('#ff6730') },
                    uPositions: { value: null },
                }}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                depthWrite={false}
                blending={AdditiveBlending}
                transparent
            />
        </points>
    );
};

const Experience = () => {
    return (
        <ExperimentLayout
            sourceLink="https://github.com/pavel-mazhuga/portfolio/tree/main/src/app/lab/particles-twist"
            webgpuVersion="/lab/particles-twist/webgpu"
        >
            <LevaWrapper />
            <div className="canvas-wrapper">
                <Canvas
                    camera={{
                        position: [0, 0, 5],
                        fov: 45,
                        near: 0.1,
                        far: 1000,
                    }}
                    gl={{ alpha: false }}
                >
                    <Suspense fallback={<PageLoading />}>
                        <Experiment />
                    </Suspense>
                    <OrbitControls />
                    <Perf />
                </Canvas>
            </div>
        </ExperimentLayout>
    );
};

export default Experience;
