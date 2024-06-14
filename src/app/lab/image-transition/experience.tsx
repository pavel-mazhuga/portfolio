'use client';

import { useTexture } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useControls } from 'leva';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Mesh, PlaneGeometry, SRGBColorSpace, ShaderMaterial, Vector2 } from 'three';
import { v4 as uuidv4 } from 'uuid';
import ExperimentBackground from '@/app/components/layout/WebGL/ExperimentBackground';
import PageLoading from '@/app/components/shared/PageLoading';
import ExperimentLayout from '../ExperimentLayout';
import LevaWrapper from '../LevaWrapper';
import fragmentShader from './shaders/fragment.glsl';
import vertexShader from './shaders/vertex.glsl';

const Experiment = () => {
    const plane = useRef<Mesh<PlaneGeometry, ShaderMaterial>>(null);
    const planeSize = new Vector2(1, 1);

    const texture1 = useTexture(
        'https://images.unsplash.com/photo-1598092655914-44f06584e31a?q=80&w=3052&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    );
    texture1.colorSpace = SRGBColorSpace;

    const texture2 = useTexture(
        'https://images.unsplash.com/photo-1551554781-c46200ea959d?q=80&w=3000&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    );
    texture2.colorSpace = SRGBColorSpace;

    const slides = useMemo(
        () => [
            { texture: texture1, size: new Vector2(texture1.image.naturalWidth, texture1.image.naturalHeight) },
            { texture: texture2, size: new Vector2(texture2.image.naturalWidth, texture2.image.naturalHeight) },
        ],
        [texture1, texture2],
    );

    const [activeIndex] = useState(0);
    const nextIndex = activeIndex === 0 ? 1 : 0;

    const { progress, waveSpeed, rippleStrength, fadeOffset, innerRippleSpeed } = useControls({
        progress: { value: 0, min: 0, max: 1, step: 0.001 },
        waveSpeed: { value: 4, min: 0, max: 20, step: 0.001 },
        rippleStrength: { value: 2, min: 0, max: 3, step: 0.001 },
        fadeOffset: { value: 0.2, min: 0, max: 0.5, step: 0.001 },
        innerRippleSpeed: { value: 2, min: 0, max: 20, step: 0.001 },
    });

    useEffect(() => {
        if (plane.current) {
            plane.current.material.uniforms.uCurrentImage.value = slides[activeIndex].texture;
            plane.current.material.uniforms.uCurrentImageSize.value = slides[activeIndex].size;
            plane.current.material.uniforms.uNextImage.value = slides[nextIndex].texture;
            plane.current.material.uniforms.uNextImageSize.value = slides[nextIndex].size;
            plane.current.material.uniforms.uProgress.value = 0;
        }
    }, [activeIndex, nextIndex, slides]);

    useFrame(({ clock }) => {
        if (plane.current) {
            plane.current.material.uniforms.uTime.value = clock.getElapsedTime();
            plane.current.material.uniforms.uProgress.value = progress;
            plane.current.material.uniforms.uWaveSpeed.value = waveSpeed;
            plane.current.material.uniforms.uFadeOffset.value = fadeOffset;
            plane.current.material.uniforms.uInnerRippleSpeed.value = innerRippleSpeed;
        }
    });

    return (
        <>
            <ExperimentBackground />
            <mesh ref={plane}>
                <planeGeometry args={[planeSize.x, planeSize.y]} />
                <shaderMaterial
                    uniforms={{
                        uCurrentImage: { value: slides[activeIndex].texture },
                        uCurrentImageSize: { value: slides[activeIndex].size },
                        uNextImage: { value: slides[nextIndex].texture },
                        uNextImageSize: { value: slides[nextIndex].size },
                        uPlaneSize: { value: planeSize },
                        uTime: { value: 0 },
                        uProgress: { value: progress },
                        uWaveSpeed: { value: waveSpeed },
                        uRippleStrength: { value: rippleStrength },
                        uFadeOffset: { value: fadeOffset },
                        uInnerRippleSpeed: { value: innerRippleSpeed },
                    }}
                    vertexShader={vertexShader}
                    fragmentShader={fragmentShader}
                    defines={{ PI: Math.PI }}
                />
            </mesh>
        </>
    );
};

const Experience = () => {
    return (
        <ExperimentLayout sourceLink="https://github.com/pavel-mazhuga/portfolio/tree/main/src/app/lab/image-transition">
            <LevaWrapper />
            <div className="canvas-wrapper">
                <Canvas
                    camera={{
                        position: [0, 0, 1.8],
                        fov: 45,
                        near: 0.1,
                        far: 1000,
                    }}
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
