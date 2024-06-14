'use client';

import { OrbitControls } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useControls } from 'leva';
import { Suspense, useMemo, useRef } from 'react';
import {
    Color,
    IcosahedronGeometry,
    MeshDepthMaterial,
    MeshPhysicalMaterial,
    RGBADepthPacking,
    ShaderMaterial,
    Vector3,
} from 'three';
import CustomShaderMaterial from 'three-custom-shader-material';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils';
import { useMediaQuery } from 'usehooks-ts';
import ExperimentBackground from '@/app/components/layout/WebGL/ExperimentBackground';
import PageLoading from '@/app/components/shared/PageLoading';
import ExperimentLayout from '../ExperimentLayout';
import LevaWrapper from '../LevaWrapper';
import fragmentShader from './shaders/fragment.glsl';
import vertexShader from './shaders/vertex.glsl';

const Experiment = () => {
    const materialRef = useRef<ShaderMaterial>(null);

    useFrame(({ clock }) => {
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = clock.elapsedTime;
        }
    });

    const {
        gradientStrength,
        color,
        speed,
        noiseStrength,
        displacementStrength,
        fractAmount,
        remapPowerRange,
        roughness,
        metalness,
        clearcoat,
        reflectivity,
        ior,
        iridescence,
    } = useControls({
        gradientStrength: {
            value: 1.3,
            min: 1,
            max: 3,
            step: 0.001,
        },
        color: '#fff900',
        speed: {
            value: 1.1,
            min: 0,
            max: 20,
            step: 0.001,
        },
        noiseStrength: {
            value: 0.29,
            min: 0,
            max: 3,
            step: 0.001,
        },
        displacementStrength: {
            value: 0.41,
            min: 0,
            max: 1,
            step: 0.001,
        },
        fractAmount: {
            value: 4,
            min: 0,
            max: 10,
            step: 1,
        },
        remapPowerRange: {
            min: 0,
            max: 1,
            value: [0.07, 0.73],
        },
        roughness: {
            min: 0,
            max: 1,
            step: 0.001,
            value: 0.5,
        },
        metalness: {
            min: 0,
            max: 1,
            step: 0.001,
            value: 0.5,
        },
        clearcoat: {
            min: 0,
            max: 1,
            step: 0.001,
            value: 0.33,
        },
        reflectivity: {
            min: 0,
            max: 1,
            step: 0.001,
            value: 0.5,
        },
        ior: {
            min: 0.001,
            max: 5,
            step: 0.001,
            value: 1.5,
        },
        iridescence: {
            min: 0,
            max: 1,
            step: 0.001,
            value: 0.15,
        },
    });

    const { intensity: ambientLightIntensity, color: ambientLightColor } = useControls('Ambient light', {
        color: '#fff',
        intensity: {
            value: 1,
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
            value: 3,
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

    const isMobile = useMediaQuery('(max-width: 1199px)');

    const geometry = useMemo(() => {
        const g = mergeVertices(new IcosahedronGeometry(1.3, isMobile ? 128 : 200));
        g.computeTangents();
        return g;
    }, [isMobile]);

    return (
        <>
            <mesh geometry={geometry} matrixAutoUpdate={false} frustumCulled={false}>
                <CustomShaderMaterial
                    baseMaterial={MeshDepthMaterial}
                    vertexShader={vertexShader}
                    silent
                    depthPacking={RGBADepthPacking}
                    attach="customDepthMaterial"
                />
                <CustomShaderMaterial
                    ref={materialRef}
                    baseMaterial={MeshPhysicalMaterial}
                    vertexShader={vertexShader}
                    fragmentShader={fragmentShader}
                    silent
                    roughness={roughness}
                    metalness={metalness}
                    reflectivity={reflectivity}
                    clearcoat={clearcoat}
                    ior={ior}
                    iridescence={iridescence}
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
                />
            </mesh>
            <ambientLight color={ambientLightColor} intensity={ambientLightIntensity} />
            <directionalLight
                color={directionalLightColor}
                intensity={directionalLightIntensity}
                position={[directionalLightPositionX, directionalLightPositionY, directionalLightPositionZ]}
            />
        </>
    );
};

const Experience = () => {
    return (
        <ExperimentLayout sourceLink="https://github.com/pavel-mazhuga/portfolio/tree/main/src/app/lab/displaced-sphere-csm">
            <div className="canvas-wrapper">
                <LevaWrapper />
                <Canvas
                    camera={{
                        position: [0, 0, 5],
                        fov: 45,
                        near: 0.1,
                        far: 100,
                    }}
                    gl={{ alpha: false }}
                >
                    <Suspense fallback={<PageLoading />}>
                        <ExperimentBackground />
                        <Experiment />
                    </Suspense>
                    <OrbitControls />
                </Canvas>
            </div>
        </ExperimentLayout>
    );
};

export default Experience;
