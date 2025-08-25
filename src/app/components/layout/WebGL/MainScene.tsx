'use client';

import { AdaptiveDpr, Preload, ScrollControls } from '@react-three/drei';
import { Suspense, useEffect, useMemo, useRef } from 'react';
import { BoxGeometry, Group, MeshBasicMaterial, PointLight } from 'three';
import { useMapRefs } from '@/hooks/use-map-refs';
import CameraMovement from './CameraMovement';
import Stand from './Stand';
import Walls from './Walls';

const portfolio = [
    {
        imgSrc: '/timeless.webp',
        href: 'https://timeless.club',
        color: '#f2f5f7',
    },
    {
        imgSrc: '/samokat-museum.webp',
        href: 'https://museum.samokat.ru',
        color: '#f2f5f7',
    },
    {
        imgSrc: '/chipsa-2.webp',
        href: 'https://chipsa.design',
        color: '#f2f5f7',
    },
    {
        imgSrc: '/zagranitsa.webp',
        href: 'https://zagranitsa.pro',
        color: '#444',
    },
    {
        imgSrc: '/control.webp',
        href: 'https://control.chipsa.design/',
        color: '#f2f5f7',
    },
    {
        imgSrc: '/ny2023.jpeg',
        href: 'https://ny.chipsa.ru/',
        color: '#555',
    },
    {
        imgSrc: '/biotech.webp',
        href: 'https://biotech.artlife.ru/',
        color: '#f5f5f5',
    },
    {
        imgSrc: '/sportex.webp',
        href: 'https://xn--j1ahcfcef2g.xn--p1ai/',
        color: '#666',
    },
];

const MainScene = () => {
    const projectStandRefs = useMapRefs<Group>(portfolio);
    const standWidth = 4.5;
    const standHeight = 8;
    const standGeometry = useMemo(() => new BoxGeometry(standWidth + 0.2, standHeight + 0.2, 0.3), []);
    const standMaterial = useMemo(() => new MeshBasicMaterial({ color: '#111' }), []);

    const pointLight = useRef<PointLight>(null);

    useEffect(() => {
        return () => {
            document.documentElement.style.cursor = '';
        };
    }, []);

    return (
        <>
            <ScrollControls horizontal damping={0} pages={portfolio.length} distance={0.5}>
                <CameraMovement light={pointLight} />
            </ScrollControls>

            <Suspense>
                <Walls />
            </Suspense>

            <Suspense>
                {portfolio.map((project, i) => (
                    <Stand
                        key={i}
                        ref={projectStandRefs.current[i]}
                        width={standWidth}
                        height={standHeight}
                        geometry={standGeometry}
                        material={standMaterial}
                        imgSrc={project.imgSrc}
                        position={[10 * i, 2.1, -10]}
                        onPointerEnter={() => {
                            document.documentElement.style.cursor = 'pointer';
                        }}
                        onPointerLeave={() => {
                            document.documentElement.style.cursor = '';
                        }}
                        color={project.color}
                        onClick={() => window.open(project.href, '_blank')}
                    />
                ))}
                <Preload all />
            </Suspense>

            <ambientLight intensity={0.06} />
            <pointLight ref={pointLight} position={[30, 55, -8]} color="#f5f5f5" intensity={10} />
            <AdaptiveDpr pixelated />
        </>
    );
};

export default MainScene;
