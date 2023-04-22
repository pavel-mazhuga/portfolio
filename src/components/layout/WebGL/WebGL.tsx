'use client';

import { WebGLRenderer } from 'three';
import { Canvas } from '@react-three/fiber';
// import { Canvas } from '@react-three/offscreen';
import { lazy, useMemo } from 'react';
import MainScene from './MainScene';

// const MainScene = lazy(() => import('./MainScene'));

const WebGL = () => {
    // const worker = useMemo(
    //     () => (typeof window !== 'undefined' ? new Worker(new URL('./worker.tsx', import.meta.url)) : null),
    //     [],
    // );

    return (
        <div className="canvas-wrapper">
            <Canvas
                // dpr={[1, 2]}
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
                // worker={worker!}
                // fallback={<MainScene />}
            >
                <MainScene />
            </Canvas>
        </div>
    );
};

export default WebGL;
