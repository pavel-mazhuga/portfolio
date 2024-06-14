'use client';

import { Environment, OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import ExperimentBackground from '@/app/components/layout/WebGL/ExperimentBackground/ExperimentBackground';
import PageLoading from '@/app/components/shared/PageLoading';
import ExperimentLayout from '../ExperimentLayout';
import Effects from './Effects';
import Sword from './Sword';

const Experiment = () => {
    return <Sword position={[-0.3, 0, 0]} rotation={[0, Math.PI / 2, Math.PI / 2]} />;
};

const Experience = () => {
    return (
        <ExperimentLayout>
            <div className="canvas-wrapper">
                <Canvas
                    camera={{
                        position: [0, 0, 4],
                        fov: 33,
                        near: 0.1,
                        far: 1000,
                    }}
                    gl={{
                        alpha: false,
                    }}
                >
                    <Suspense fallback={<PageLoading />}>
                        <Experiment />
                    </Suspense>
                    {/* <ExperimentBackground color="#222" /> */}
                    <ambientLight intensity={1} />
                    <Environment preset="night" />
                    <OrbitControls />
                    <Effects />
                </Canvas>
            </div>
        </ExperimentLayout>
    );
};

export default Experience;
