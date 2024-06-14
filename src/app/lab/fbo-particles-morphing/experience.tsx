'use client';

import { OrbitControls, useFBO } from '@react-three/drei';
import { Canvas, createPortal, extend, useFrame, useThree } from '@react-three/fiber';
import { animate } from 'framer-motion';
import { useControls } from 'leva';
import { Suspense, useEffect, useMemo, useRef } from 'react';
import {
    AdditiveBlending,
    BufferGeometry,
    Color,
    FloatType,
    NearestFilter,
    OrthographicCamera,
    Points,
    RGBAFormat,
    Scene,
    ShaderMaterial,
} from 'three';
import { v4 as uuidv4 } from 'uuid';
import PageLoading from '@/app/components/shared/PageLoading';
import { easeInOutQuart } from '@/easings';
import ExperimentLayout from '../ExperimentLayout';
import LevaWrapper from '../LevaWrapper';
import { SimulationMaterial as SMaterial } from './SimulationMaterial';
import fragmentShader from './shaders/fragment.glsl';
import vertexShader from './shaders/vertex.glsl';

extend({ SMaterial });

const Experiment = () => {
    const meshRef = useRef<Points<BufferGeometry, ShaderMaterial>>(null);
    const simulationMaterialRef = useRef<SMaterial>(null);
    const progress = useRef(0);
    const canvas = useThree((state) => state.gl.domElement);

    const {
        count: size,
        speed,
        colorA,
        colorB,
    } = useControls({
        count: {
            value: 400,
            min: 0,
            max: 500,
            step: 1,
        },
        speed: {
            value: 0.07,
            min: 0,
            max: 1,
            step: 0.001,
        },
        colorA: '#9a441f',
        colorB: '#802974',
    });

    const scene = new Scene();
    const fboCamera = new OrthographicCamera(-1, 1, 1, -1, 1 / Math.pow(2, 53), 1);
    const positions = new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0]);
    const uvs = new Float32Array([0, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0]);

    const renderTarget = useFBO(size, size, {
        minFilter: NearestFilter,
        magFilter: NearestFilter,
        format: RGBAFormat,
        stencilBuffer: false,
        type: FloatType,
    });

    const particlesPosition = useMemo(() => {
        const length = size * size;
        const particles = new Float32Array(length * 3);

        for (let i = 0; i < length; i++) {
            let i3 = i * 3;
            particles[i3 + 0] = (i % size) / size;
            particles[i3 + 1] = i / size / size;
        }

        return particles;
    }, [size]);

    const uniforms = useMemo(
        () => ({
            uPositions: { value: null },
            uTime: { value: 0 },
            uProgress: { value: 0 },
            uColorA: { value: new Color(colorA) },
            uColorB: { value: new Color(colorB) },
        }),
        [colorA, colorB],
    );

    const done = useRef<boolean>(false);

    useEffect(() => {
        const onClick = () => {
            animate(progress.current, done.current ? 0 : 1, {
                duration: 2,
                ease: easeInOutQuart,
                onUpdate: (val) => {
                    progress.current = val;
                },
            });

            done.current = !done.current;
        };

        canvas.addEventListener('click', onClick);

        return () => {
            canvas.removeEventListener('click', onClick);
        };
    }, [canvas]);

    useFrame(({ gl, clock }) => {
        const time = clock.getElapsedTime();

        gl.setRenderTarget(renderTarget);
        gl.clear();
        gl.render(scene, fboCamera);
        gl.setRenderTarget(null);

        meshRef.current!.material.uniforms.uPositions.value = renderTarget.texture;
        meshRef.current!.material.uniforms.uTime.value = time;
        meshRef.current!.material.uniforms.uProgress.value = progress.current;

        simulationMaterialRef.current!.uniforms.uTime.value = time;
        simulationMaterialRef.current!.uniforms.uProgress.value = progress.current;
    });

    return (
        <>
            {createPortal(
                <mesh>
                    <sMaterial ref={simulationMaterialRef} args={[size, speed, progress.current]} />
                    <bufferGeometry>
                        <bufferAttribute
                            attach="attributes-position"
                            count={positions.length / 3}
                            array={positions}
                            itemSize={3}
                        />
                        <bufferAttribute attach="attributes-uv" count={uvs.length / 2} array={uvs} itemSize={2} />
                    </bufferGeometry>
                </mesh>,
                scene,
            )}
            <points ref={meshRef} rotation={[0.2, -Math.PI * 0.42, 0]}>
                <bufferGeometry>
                    <bufferAttribute
                        key={particlesPosition.length}
                        attach="attributes-position"
                        count={particlesPosition.length / 3}
                        array={particlesPosition}
                        itemSize={3}
                    />
                </bufferGeometry>
                <shaderMaterial
                    uniforms={uniforms}
                    vertexShader={vertexShader}
                    fragmentShader={fragmentShader}
                    depthWrite={false}
                    blending={AdditiveBlending}
                />
            </points>
        </>
    );
};

const Experience = () => {
    return (
        <ExperimentLayout sourceLink="https://github.com/pavel-mazhuga/portfolio/tree/main/src/app/lab/fbo-particles-morphing">
            <LevaWrapper />
            <div className="canvas-wrapper">
                <Canvas
                    camera={{
                        position: [0, 0, 5],
                        fov: 45,
                        near: 0.1,
                        far: 1000,
                    }}
                    gl={{ alpha: false, antialias: false }}
                >
                    <Suspense fallback={<PageLoading />}>
                        <Experiment />
                    </Suspense>
                    <OrbitControls />
                </Canvas>
            </div>
        </ExperimentLayout>
    );
};

export default Experience;
