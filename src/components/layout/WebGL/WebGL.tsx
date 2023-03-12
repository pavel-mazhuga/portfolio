'use client';

import { WebGLRenderer } from 'three';
import { Canvas } from '@react-three/fiber';

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
                gl={(canvas) => new WebGLRenderer({ canvas })}
            >
                <mesh>
                    <circleGeometry />
                    <meshBasicMaterial />
                </mesh>
                {/* <Model isWebGLOpen={isOpen} setIsWebGLOpen={setIsOpen} /> */}
            </Canvas>
        </div>
    );
};

export default WebGL;
