'use client';

import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { Html } from '@react-three/drei';
import PlaneWaveExperiment from './experiment';

const PlaneWaveExperimentPage = () => {
    return (
        <div className="canvas-wrapper">
            <Canvas
                camera={{
                    position: [0, 0, 1.8],
                    fov: 45,
                    near: 0.1,
                    far: 100,
                }}
            >
                <Suspense
                    fallback={
                        <Html center>
                            <p>Loading...</p>
                        </Html>
                    }
                >
                    <PlaneWaveExperiment />
                </Suspense>
            </Canvas>
        </div>
    );
};

export default PlaneWaveExperimentPage;
