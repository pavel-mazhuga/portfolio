'use client';

import { OrbitControls } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useControls } from 'leva';
import { Suspense, useRef } from 'react';
import { Color, Mesh, PlaneGeometry, ShaderMaterial, Vector3 } from 'three';
import { useMediaQuery } from 'usehooks-ts';
import ExperimentBackground from '@/app/components/layout/WebGL/ExperimentBackground';
import PageLoading from '@/app/components/shared/PageLoading';
import ExperimentLayout from '../ExperimentLayout';
import LevaWrapper from '../LevaWrapper';
import fragmentShader from './shaders/fragment.glsl';
import vertexShader from './shaders/vertex.glsl';

const Experiment = ({ isMobile }: { isMobile: boolean }) => {
    const materialRef = useRef<ShaderMaterial>(null);

    const { gradientStrength, color, speed, noiseStrength, displacementStrength, fractAmount, remapPowerRange } =
        useControls({
            gradientStrength: {
                value: 1.3,
                min: 1,
                max: 3,
                step: 0.001,
            },
            color: '#2994ff',
            speed: {
                value: 1.1,
                min: 0,
                max: 20,
                step: 0.001,
            },
            noiseStrength: {
                value: 1,
                min: 0,
                max: 3,
                step: 0.001,
            },
            displacementStrength: {
                value: 0.3,
                min: 0,
                max: 1,
                step: 0.001,
            },
            fractAmount: {
                value: 6,
                min: 0,
                max: 10,
                step: 1,
            },
            remapPowerRange: {
                min: 0,
                max: 1,
                value: [0.4, 0.7],
            },
        });

    const { intensity: ambientLightIntensity, color: ambientLightColor } = useControls('Ambient light', {
        color: '#fff',
        intensity: {
            value: 0.35,
            min: 0,
            max: 1,
            step: 0.001,
        },
    });

    const {
        intensity: directionalLightIntensity,
        color: directionalLightColor,
        positionX: directionalLightPositionX,
        positionY: directionalLightPositionY,
        positionZ: directionalLightPositionZ,
    } = useControls('Directional light', {
        color: '#fff',
        intensity: {
            value: 1,
            min: 0,
            max: 5,
            step: 0.001,
        },
        positionX: {
            value: -2,
            min: -10,
            max: 10,
            step: 0.001,
        },
        positionY: {
            value: 2,
            min: -10,
            max: 10,
            step: 0.001,
        },
        positionZ: {
            value: 3.5,
            min: -10,
            max: 10,
            step: 0.001,
        },
    });

    useFrame(({ clock }) => {
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
        }
    });

    return (
        <mesh matrixAutoUpdate={false} frustumCulled={false}>
            <icosahedronGeometry args={[1.3, isMobile ? 180 : 256]} />
            <shaderMaterial
                ref={materialRef}
                uniforms={{
                    uTime: { value: 0 },
                    uColor: { value: new Color(color) },
                    uGradientStrength: { value: gradientStrength },
                    uAmbientLightColor: { value: new Color(ambientLightColor) },
                    uAmbientLightIntensity: { value: ambientLightIntensity },
                    uDirectionalLightColor: { value: new Color(directionalLightColor) },
                    uDirectionalLightIntensity: { value: directionalLightIntensity },
                    uDirectionalLightPosition: {
                        value: new Vector3(
                            directionalLightPositionX,
                            directionalLightPositionY,
                            directionalLightPositionZ,
                        ),
                    },
                    uSpeed: { value: speed },
                    uNoiseStrength: { value: noiseStrength },
                    uDisplacementStrength: { value: displacementStrength },
                    uFractAmount: { value: fractAmount },
                    uRemapPower: { value: remapPowerRange },
                }}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
            />
        </mesh>
    );
};

const Experience = () => {
    const isMobile = useMediaQuery('(max-width: 1199px)');

    return (
        <ExperimentLayout
            sourceLink="https://github.com/pavel-mazhuga/portfolio/tree/main/src/app/lab/displaced-sphere-2"
            webgpuVersion="/lab/displaced-sphere-2/webgpu"
        >
            <LevaWrapper />
            <div className="canvas-wrapper">
                <Canvas
                    camera={{
                        position: [0, 0, isMobile ? 9 : 5],
                        fov: 45,
                        near: 0.1,
                        far: 1000,
                    }}
                    gl={{ alpha: false }}
                >
                    <Suspense fallback={<PageLoading />}>
                        <ExperimentBackground />
                        <Experiment isMobile={isMobile} />
                    </Suspense>
                    <OrbitControls />
                </Canvas>
            </div>
        </ExperimentLayout>
    );
};

export default Experience;
