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
                    position: [0, 1.6, 15],
                    fov: 35,
                    near: 1,
                    far: 1000,
                }}
                gl={(canvas) => new WebGLRenderer({ canvas, antialias: false })}
            >
                <color attach="background" args={['black']} />
                <MainScene />
            </Canvas>
        </div>
    );
};

export default WebGL;
