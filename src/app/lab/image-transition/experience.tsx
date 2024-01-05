'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useTexture } from '@react-three/drei';
import { Mesh, PlaneGeometry, SRGBColorSpace, ShaderMaterial, Vector2 } from 'three';
import { useControls } from 'leva';
import { v4 as uuidv4 } from 'uuid';
import ExperimentLayout from '../ExperimentLayout';
import PageLoading from '@/components/shared/PageLoading';
import vertexShader from './shaders/vertex.glsl';
import fragmentShader from './shaders/fragment.glsl';
import { animate } from 'framer-motion';
import { easeInOutQuart } from '@/easings';

const Experiment = () => {
    const plane = useRef<Mesh<PlaneGeometry, ShaderMaterial>>(null);
    const canvas = useThree((state) => state.gl.domElement);

    const texture = useTexture(
        'https://images.unsplash.com/photo-1592853598064-5a7fa150592c?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    );
    texture.colorSpace = SRGBColorSpace;

    const texture2 = useTexture(
        'https://images.unsplash.com/photo-1551554781-c46200ea959d?q=80&w=3000&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    );
    texture2.colorSpace = SRGBColorSpace;

    const [activeTex, setActiveTex] = useState(texture);

    const { progress } = useControls({
        progress: { value: 0, min: 0, max: 1, step: 0.001 },
    });

    // useEffect(() => {
    //     const onClick = () => {
    //         animate(0, 1, {
    //             duration: 3,
    //             ease: easeInOutQuart,
    //             onUpdate: (val) => {
    //                 plane.current!.material.uniforms.uProgress.value = val;
    //             },
    //             onComplete: () => {
    //                 setActiveTex((prevActiveTex) => (prevActiveTex === texture ? texture2 : texture));
    //             },
    //         });
    //     };

    //     canvas.addEventListener('click', onClick);

    //     return () => {
    //         canvas.removeEventListener('click', onClick);
    //     };
    // }, [texture, texture2, canvas]);

    useEffect(() => {
        plane.current!.material.uniforms.image.value = activeTex;
        plane.current!.material.uniforms.image2.value = activeTex === texture ? texture2 : texture;
        plane.current!.material.uniforms.uProgress.value = 0;
    }, [activeTex, texture, texture2]);

    useFrame(({ clock }) => {
        plane.current!.material.uniforms.uTime.value = clock.getElapsedTime();
        plane.current!.material.uniforms.uProgress.value = progress;
    });

    return (
        <mesh ref={plane}>
            <planeGeometry />
            <shaderMaterial
                key={uuidv4()}
                uniforms={{
                    image: { value: texture },
                    sizeImage: {
                        value: new Vector2(texture.image.naturalWidth, texture.image.naturalHeight),
                    },
                    image2: { value: texture2 },
                    sizeImage2: {
                        value: new Vector2(texture2.image.naturalWidth, texture2.image.naturalHeight),
                    },
                    planeSize: {
                        value: new Vector2(1, 1),
                    },
                    uTime: { value: 0 },
                    uProgress: { value: 0 },
                }}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                defines={{ PI: Math.PI }}
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
                        position: [0, 0, 1.8],
                        fov: 45,
                        near: 0.1,
                        far: 100,
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
