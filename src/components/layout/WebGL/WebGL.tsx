'use client';

import { WebGLRenderer } from 'three';
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { Preload } from '@react-three/drei';
import MainScene from './MainScene';

const WebGL = () => {
    return (
        <div className="canvas-wrapper">
            <Canvas
                dpr={[1, 1.5]}
                camera={{
                    position: [0, 2, 20],
                    fov: 35,
                    near: 1,
                    far: 100,
                }}
                gl={(canvas) => {
                    const renderer = new WebGLRenderer({ canvas, antialias: false });
                    return renderer;
                }}
            >
                <Suspense>
                    <MainScene />
                    <Preload all />
                </Suspense>
            </Canvas>
        </div>
    );
};

export default WebGL;
