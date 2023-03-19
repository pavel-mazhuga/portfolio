'use client';

import { WebGLRenderer } from 'three';
import { Canvas } from '@react-three/fiber';
import Works from './Works';

const WebGL = () => {
    return (
        <div className="canvas-wrapper">
            <Canvas
                dpr={[1, 1.5]}
                camera={{
                    position: [0, 0, 15],
                    fov: 45,
                    near: 1,
                    far: 1000,
                }}
                gl={(canvas) => new WebGLRenderer({ canvas, alpha: true })}
            >
                <Works />
            </Canvas>
        </div>
    );
};

export default WebGL;
