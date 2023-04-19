'use client';

import { WebGLRenderer } from 'three';
import { Canvas } from '@react-three/fiber';
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
                <MainScene />
            </Canvas>
        </div>
    );
};

export default WebGL;
