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
        videoUrl: '/zagranitsa_9x16.mp4',
        href: 'https://zagranitsa.chipsa.ru',
    },
    {
        videoUrl: '/chipsa_9x16.mp4',
        href: 'https://chipsa.design',
    },
    {
        videoUrl: '/control_9x16.mp4',
        href: 'https://control.chipsa.ru/',
    },
    {
        videoUrl: '/biotech_9x16.mp4',
        href: 'https://biotech.artlife.ru/',
    },
    {
        videoUrl: '/sportex_9x16.mp4',
        href: 'https://xn--j1ahcfcef2g.xn--p1ai/',
    },
    {
        videoUrl: '/malinovka_9x16.mp4',
        href: 'https://24fermer.ru/',
    },
    {
        videoUrl: '/asap_9x16.mp4',
        href: 'https://asap.digital/',
    },
];

const MainScene = () => {
    const wheelX = useRef<number>(0);
    const projectStandRefs = useMapRefs<Mesh>(portfolio);

    useEffect(() => {
        const onWheel = (event: WheelEvent) => {
            const delta = event.deltaY === 0 ? event.deltaX : event.deltaY;
            wheelX.current = clamp(wheelX.current + delta, 0, 2860 * portfolio.length);
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
                    position={[10 * i, 2.5, -10]}
                    onPointerEnter={() => {
                        document.documentElement.style.cursor = 'pointer';
                    }}
                    onPointerLeave={() => {
                        document.documentElement.style.cursor = '';
                    }}
                    onClick={() => window.open(project.href, '_blank')}
                />
            ))}

            <Ground />
            <fog attach="fog" args={['#090909', 25, 60]} />
            <ambientLight intensity={0.3} />
            <Environment preset="sunset" />
        </>
    );
};

export default MainScene;
