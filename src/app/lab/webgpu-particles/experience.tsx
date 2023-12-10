'use client';

import { Canvas } from '@react-three/fiber';
import { Suspense, useState } from 'react';
import { Html } from '@react-three/drei';
// import WebGPURenderer from 'three/examples/jsm/renderers/webgpu/WebGPURenderer';
import ExperimentLayout from '../ExperimentLayout';
import { WebGPU } from './WebGPU';

// const r = new WebGPURenderer({ antialias: false });
// console.log(r.init);

const Experiment = () => {
    return (
        <mesh>
            <planeGeometry args={[1, 1, 64, 64]} />
        </mesh>
    );
};

const Experience = () => {
    // const [frameloop, setFrameloop] = useState<'never' | 'always' | 'demand'>('never');

    // console.log({ frameloop });

    return (
        <ExperimentLayout>
            <div className="canvas-wrapper">
                <Canvas
                    camera={{
                        position: [0, 0, 1.8],
                        fov: 45,
                        near: 0.1,
                        far: 100,
                    }}
                    // gl={(canvas) => {
                    //     const renderer = new WebGPURenderer({ canvas });
                    //     // await renderer.init(); /* .then(() => {
                    //     //     setFrameloop('always');
                    //     // }); */
                    //     // setFrameloop('always');
                    //     return renderer;
                    // }}
                    // onCreated={async (state) => {
                    //     await state.gl.init();
                    //     state.set({ frameloop: 'always' });
                    // }}
                    frameloop="never"
                >
                    <WebGPU>
                        <Suspense
                            fallback={
                                <Html center>
                                    <p>Loading...</p>
                                </Html>
                            }
                        >
                            <Experiment />
                        </Suspense>
                    </WebGPU>
                </Canvas>
            </div>
        </ExperimentLayout>
    );
};

export default Experience;
