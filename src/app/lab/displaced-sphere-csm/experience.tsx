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
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { useMediaQuery } from 'usehooks-ts';
import ExperimentBackground from '@/app/components/layout/WebGL/ExperimentBackground';
import PageLoading from '@/app/components/shared/PageLoading';
import ExperimentLayout from '../ExperimentLayout';
import LevaWrapper from '../LevaWrapper';
import fragmentShader from './shaders/fragment.glsl';
import vertexShader from './shaders/vertex.glsl';

const Experiment = ({ isMobile }: { isMobile: boolean }) => {
    const materialRef = useRef<ShaderMaterial>(null);
    const depthMaterialRef = useRef<ShaderMaterial>(null);

    useFrame(({ clock }) => {
        const elapsedTime = clock.getElapsedTime();

        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = elapsedTime;
        }

        if (depthMaterialRef.current) {
            depthMaterialRef.current.uniforms.uTime.value = elapsedTime;
        }
    });

    const {
        gradientStrength,
        color,
        speed,
        noiseStrength,
        displacementStrength,
        fractAmount,
        roughness,
        metalness,
        clearcoat,
        reflectivity,
        ior,
        iridescence,
    } = useControls({
        gradientStrength: {
            value: 1,
            min: 1,
            max: 3,
            step: 0.001,
        },
        // color: '#fff900',
        color: '#af00ff',
        speed: {
            value: 1.1,
            min: 0,
            max: 20,
            step: 0.001,
        },
        noiseStrength: {
            value: 0.45,
            min: 0,
            max: 3,
            step: 0.001,
        },
        displacementStrength: {
            value: 0.57,
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
        roughness: {
            min: 0,
            max: 1,
            step: 0.001,
            // value: 0.5,
            value: 0.56,
        },
        metalness: {
            min: 0,
            max: 1,
            step: 0.001,
            // value: 0.5,
            value: 0.76,
        },
        clearcoat: {
            min: 0,
            max: 1,
            step: 0.001,
            // value: 0.33,
            value: 0,
        },
        reflectivity: {
            min: 0,
            max: 1,
            step: 0.001,
            // value: 0.5,
            value: 0.46,
        },
        ior: {
            min: 0.001,
            max: 5,
            step: 0.001,
            // value: 1.5,
            value: 2.81,
        },
        iridescence: {
            min: 0,
            max: 1,
            step: 0.001,
            // value: 0.15,
            value: 0.96,
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
            // value: 3,
            value: 5,
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

    const geometry = useMemo(() => {
        const g = mergeVertices(new IcosahedronGeometry(1.3, isMobile ? 128 : 200));
        g.computeTangents();
        return g;
    }, [isMobile]);

    const uniforms = {
        uTime: { value: 0 },
        uColor: { value: new Color(color) },
        uGradientStrength: { value: gradientStrength },
        uSpeed: { value: speed },
        uNoiseStrength: { value: noiseStrength },
        uDisplacementStrength: { value: displacementStrength },
        uFractAmount: { value: fractAmount },
    };

    return (
        <>
            <mesh geometry={geometry} matrixAutoUpdate={false} frustumCulled={false}>
                <CustomShaderMaterial
                    ref={materialRef as any}
                    baseMaterial={MeshPhysicalMaterial}
                    vertexShader={vertexShader}
                    fragmentShader={fragmentShader}
                    roughness={roughness}
                    metalness={metalness}
                    reflectivity={reflectivity}
                    clearcoat={clearcoat}
                    ior={ior}
                    iridescence={iridescence}
                    uniforms={uniforms}
                />
                <CustomShaderMaterial
                    ref={depthMaterialRef as any}
                    baseMaterial={MeshDepthMaterial}
                    vertexShader={vertexShader}
                    uniforms={uniforms}
                    depthPacking={RGBADepthPacking}
                    attach="customDepthMaterial"
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
    const isMobile = useMediaQuery('(max-width: 1199px)');

    return (
        <ExperimentLayout sourceLink="https://github.com/pavel-mazhuga/portfolio/tree/main/src/app/lab/displaced-sphere-csm">
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
