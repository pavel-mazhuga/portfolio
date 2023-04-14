'use client';

import { useMapRefs } from '@/hooks/use-map-refs';
import { clamp } from '@/utils/clamp';
import { lerp } from '@/utils/lerp';
import { Environment } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { Mesh } from 'three';
import Ground from './Ground';
import Stand from './Stand';

const portfolio = [
    {
        videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        href: 'https://chipsa.ru',
    },
    {
        videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        href: 'https://chipsa.ru',
    },
    {
        videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        href: 'https://chipsa.ru',
    },
    {
        videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        href: 'https://chipsa.ru',
    },
];

const MainScene = () => {
    const wheelX = useRef<number>(0);
    const projectStandRefs = useMapRefs<Mesh>(portfolio);

    useEffect(() => {
        const onWheel = (event: WheelEvent) => {
            const delta = event.deltaY === 0 ? event.deltaX : event.deltaY;
            wheelX.current = clamp(wheelX.current + delta, 0, 1550 * portfolio.length);
        };

        window.addEventListener('wheel', onWheel);

        return () => window.removeEventListener('wheel', onWheel);
    }, []);

    useFrame(({ camera }) => {
        camera.position.x = lerp(camera.position.x, wheelX.current * 0.003, 0.07);
    });

    return (
        <>
            {portfolio.map((project, i) => (
                <Stand
                    ref={projectStandRefs.current[i]}
                    key={i}
                    videoUrl={project.videoUrl}
                    position={[6 * i, 1.4, -10]}
                    onPointerEnter={() => {}}
                    onPointerLeave={() => {}}
                    onClick={() => window.open(project.href, '_blank')}
                />
            ))}

            <Ground />
            <fog attach="fog" args={['#000', 20, 40]} />
            <ambientLight intensity={0.2} />
            <Environment preset="sunset" />
        </>
    );
};

export default MainScene;
