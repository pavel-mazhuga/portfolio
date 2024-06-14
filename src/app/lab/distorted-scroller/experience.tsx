'use client';

import { Scroll, ScrollControls } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import { useMemo } from 'react';
import { Vector2 } from 'three';
import { useMediaQueryDeviceState } from '@/atoms/media-query-device';
import ExperimentLayout from '../ExperimentLayout';
import Slider from './Slider';

const Experiment = () => {
    const images = [
        'https://images.unsplash.com/photo-1529611355777-315dad1f9f4d?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8aGQlMjBjYXJ8ZW58MHx8MHx8fDA%3D',
        'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?q=80&w=2720&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        'https://images.unsplash.com/photo-1523299655748-ec4fc1d377c1?q=80&w=3432&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        'https://images.unsplash.com/photo-1643694985710-4e26a746734b?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        'https://images.unsplash.com/photo-1531435892188-1e695988a243?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        'https://images.unsplash.com/photo-1693485320289-70e5c29726b3?q=80&w=3552&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        'https://images.unsplash.com/photo-1695192193767-54887768f845?q=80&w=3328&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        'https://images.unsplash.com/photo-1704174840778-f014998a38f3?q=80&w=3432&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        'https://images.unsplash.com/photo-1681869916819-cb81574a02e7?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    ];

    const [mediaQueryDevice] = useMediaQueryDeviceState();
    const { width } = useThree((state) => state.viewport);
    const planeSize = useMemo(
        () => new Vector2(1, 0.5625).multiplyScalar(mediaQueryDevice.includes('mobile') ? 1 : 3),
        [mediaQueryDevice],
    );
    const gap = 0.15;

    return (
        <ScrollControls
            horizontal
            damping={0.1}
            pages={(width + (images.length - 1) * (planeSize.x + gap)) / width}
            distance={0.7}
        >
            <Scroll>
                <Slider images={images} planeSize={planeSize} gap={gap} />
            </Scroll>
        </ScrollControls>
    );
};

const Experience = () => {
    return (
        <ExperimentLayout sourceLink="https://github.com/pavel-mazhuga/portfolio/tree/main/src/app/lab/distorted-scroller">
            <div className="canvas-wrapper">
                <Canvas
                    camera={{
                        position: [0, 0, 5],
                        fov: 45,
                        near: 0.1,
                        far: 1000,
                    }}
                >
                    <Experiment />
                </Canvas>
            </div>
        </ExperimentLayout>
    );
};

export default Experience;
