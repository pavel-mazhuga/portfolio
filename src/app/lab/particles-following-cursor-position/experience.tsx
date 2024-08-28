'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useControls } from 'leva';
import { Suspense, useEffect, useMemo, useRef } from 'react';
import { BufferGeometry, Mesh, MeshBasicMaterial, PlaneGeometry, Points, ShaderMaterial } from 'three';
import { v4 as uuidv4 } from 'uuid';
import PageLoading from '@/app/components/shared/PageLoading';
import { lerp } from '@/utils/lerp';
import ExperimentLayout from '../ExperimentLayout';
import LevaWrapper from '../LevaWrapper';
import fragmentShader from './shaders/fragment.glsl';
import vertexShader from './shaders/vertex.glsl';
import useGPGPUPositions from './useGPGPUPositions';

const Experiment = () => {
    const meshRef = useRef<Points<BufferGeometry, ShaderMaterial>>(null);
    const prevTime = useRef(0);
    const speed = useRef<number>(3);
    const viewport = useThree((state) => state.viewport);

    const { size } = useControls({
        size: {
            value: 80,
            min: 0,
            max: 300,
            step: 1,
        },
        speed: {
            value: speed.current,
            min: 0,
            max: 10,
            step: 0.001,
            onChange: (val: number) => {
                if (gpgpuPositions.simulationMeshRef.current) {
                    gpgpuPositions.simulationMeshRef.current.material.uniforms.uSpeed.value = val;
                }
                speed.current = val;
            },
        },
    });

    const gpgpuPositions = useGPGPUPositions(size);

    const particlesPosition = useMemo(() => {
        const length = size * size;
        const positions = new Float32Array(length * 3);

        for (let i = 0; i < length; i++) {
            let i3 = i * 3;
            positions[i3 + 0] = (i % size) / size;
            positions[i3 + 1] = i / size / size;
            positions[i3 + 2] = 0;
        }

        return positions;
    }, [size]);

    const particlesSize = useMemo(() => {
        const length = size * size;
        const sizes = new Float32Array(length);

        for (let i = 0; i < length; i++) {
            sizes[i] = Math.random() * 0.5 + 0.5;
        }

        return sizes;
    }, [size]);

    const particlesColor = useMemo(() => {
        const length = size * size;
        const colors = new Float32Array(length * 3);

        for (let i = 0; i < length; i++) {
            let i3 = i * 3;
            colors[i3 + 0] = Math.random();
            colors[i3 + 1] = Math.random();
            colors[i3 + 2] = Math.random();
        }

        return colors;
    }, [size]);

    const dummyPlane = useMemo(
        () => new Mesh(new PlaneGeometry(viewport.width, viewport.height), new MeshBasicMaterial()),
        [viewport.width, viewport.height],
    );

    const uniforms = useMemo(
        () => ({
            uPositions: { value: null },
            uTime: { value: 0 },
        }),
        [],
    );

    useEffect(() => {
        if (gpgpuPositions.simulationMeshRef.current) {
            gpgpuPositions.simulationMeshRef.current.material.uniforms.uSpeed.value = speed.current;
        }
    }, [gpgpuPositions.simulationMeshRef, size]);

    useFrame(({ gl, clock, pointer, raycaster, camera }) => {
        const time = clock.getElapsedTime();
        const delta = time - prevTime.current;
        const gpgpuPositionsRt = gpgpuPositions.compute(gl);

        if (gpgpuPositions.simulationMeshRef.current) {
            raycaster.setFromCamera(pointer, camera);
            const intersects = raycaster.intersectObject(dummyPlane);

            if (intersects.length > 0) {
                const { x, y } = intersects[0].point;

                gpgpuPositions.simulationMeshRef.current.material.uniforms.uPointer.value.x = lerp(
                    gpgpuPositions.simulationMeshRef.current.material.uniforms.uPointer.value.x,
                    x,
                    delta * 1.5,
                );
                gpgpuPositions.simulationMeshRef.current.material.uniforms.uPointer.value.y = lerp(
                    gpgpuPositions.simulationMeshRef.current.material.uniforms.uPointer.value.y,
                    y,
                    delta * 1.5,
                );
            }

            gpgpuPositions.simulationMeshRef.current.material.uniforms.uTime.value = time;
        }

        if (meshRef.current) {
            meshRef.current.material.uniforms.uPositions.value = gpgpuPositionsRt.texture;
            meshRef.current.material.uniforms.uTime.value = time;
        }

        prevTime.current = time;
    });

    return (
        <>
            {gpgpuPositions.renderOffscreen()}
            <points ref={meshRef}>
                <bufferGeometry>
                    <bufferAttribute
                        key={`position-${particlesPosition.length}`}
                        attach="attributes-position"
                        count={particlesPosition.length / 3}
                        array={particlesPosition}
                        itemSize={3}
                    />
                    <bufferAttribute
                        key={`color-${particlesColor.length}`}
                        attach="attributes-aColor"
                        count={particlesColor.length / 3}
                        array={particlesColor}
                        itemSize={3}
                    />
                    <bufferAttribute
                        key={`size-${particlesSize.length}`}
                        attach="attributes-aSize"
                        count={particlesSize.length}
                        array={particlesSize}
                        itemSize={1}
                    />
                </bufferGeometry>
                <shaderMaterial
                    key={process.env.NODE_ENV === 'development' ? uuidv4() : undefined}
                    uniforms={uniforms}
                    vertexShader={vertexShader}
                    fragmentShader={fragmentShader}
                    depthWrite={false}
                    transparent
                />
            </points>
        </>
    );
};

const Experience = () => {
    return (
        <ExperimentLayout sourceLink="https://github.com/pavel-mazhuga/portfolio/tree/main/src/app/lab/particles-following-cursor-position">
            <LevaWrapper />
            <div className="canvas-wrapper">
                <Canvas
                    camera={{
                        position: [0, 0, 3],
                        fov: 45,
                        near: 0.1,
                        far: 1000,
                    }}
                    gl={{ alpha: false, antialias: false }}
                >
                    <color args={['#0a0a0a']} attach="background" />
                    <Suspense fallback={<PageLoading />}>
                        <Experiment />
                    </Suspense>
                </Canvas>
            </div>
        </ExperimentLayout>
    );
};

export default Experience;
