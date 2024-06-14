'use client';

import { PerformanceMonitor } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import round from 'lodash.round';
// import { Canvas } from '@react-three/offscreen';
import { useState } from 'react';
import { WebGLRenderer } from 'three';
import MainScene from './MainScene';

// const MainScene = lazy(() => import('./MainScene'));

const WebGL = () => {
    // const worker = useMemo(
    //     () => (typeof window !== 'undefined' ? new Worker(new URL('./worker.tsx', import.meta.url)) : null),
    //     [],
    // );
    const maxDpr = 1.5;
    const [dpr, setDpr] = useState(maxDpr);

    return (
        <div className="canvas-wrapper">
            <Canvas
                dpr={dpr}
                camera={{
                    position: [0, 2, 20],
                    fov: 35,
                    near: 1,
                    far: 1000,
                }}
                // gl={(canvas) => {
                //     const renderer = new WebGLRenderer({ canvas, antialias: false });
                //     return renderer;
                // }}
                // worker={worker!}
                // fallback={<MainScene />}
            >
                <PerformanceMonitor onChange={({ factor }) => setDpr(Math.min(round(1 + factor, 2), maxDpr))}>
                    <MainScene />
                </PerformanceMonitor>
            </Canvas>
        </div>
    );
};

export default WebGL;
