'use client';

import { WebGLRenderer } from 'three';
import { Canvas } from '@react-three/fiber';
// import { Canvas } from '@react-three/offscreen';
import { useState } from 'react';
import { PerformanceMonitor } from '@react-three/drei';
import round from 'lodash.round';
import MainScene from './MainScene';

// const MainScene = lazy(() => import('./MainScene'));

const WebGL = () => {
    // const worker = useMemo(
    //     () => (typeof window !== 'undefined' ? new Worker(new URL('./worker.tsx', import.meta.url)) : null),
    //     [],
    // );
    const [dpr, setDpr] = useState(1.5);

    return (
        <div className="canvas-wrapper">
            <Canvas
                dpr={dpr}
                camera={{
                    position: [0, 2, 20],
                    fov: 35,
                    near: 1,
                    far: 100,
                }}
                // gl={(canvas) => {
                //     const renderer = new WebGLRenderer({ canvas, antialias: false });
                //     return renderer;
                // }}
                // worker={worker!}
                // fallback={<MainScene />}
            >
                <PerformanceMonitor onChange={({ factor }) => setDpr(round(1 + factor, 1))}>
                    <MainScene />
                </PerformanceMonitor>
            </Canvas>
        </div>
    );
};

export default WebGL;
