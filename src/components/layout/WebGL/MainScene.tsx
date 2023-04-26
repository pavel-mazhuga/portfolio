'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { BoxGeometry, Group, MeshBasicMaterial, Object3D, PointLight } from 'three';
import { useMapRefs } from '@/hooks/use-map-refs';
import Ground from './Ground';
import Stand from './Stand';
import Walls from './Walls';
import { AdaptiveDpr, Preload, ScrollControls } from '@react-three/drei';
import { useMediaQueryDeviceState } from '@/atoms/media-query-device';
import CameraMovement from './CameraMovement';

const portfolio = [
    {
        videoUrls: [
            { src: '/zagranitsa_9x16.av1.mp4', type: 'video/mp4; codecs=av01.0.05M.08,opus' },
            { src: '/zagranitsa_9x16.mp4', type: 'video/mp4' },
        ],
        imgSrc: '/zagranitsa.webp',
        href: 'https://new.bosfor.pictures/',
        color: '#444',
    },
    {
        videoUrls: [
            { src: '/chipsa_9x16.av1.mp4', type: 'video/mp4; codecs=av01.0.05M.08,opus' },
            { src: '/chipsa_9x16.mp4', type: 'video/mp4' },
        ],
        imgSrc: '/chipsa.webp',
        href: 'https://chipsa.design',
        color: '#f2f5f7',
    },
    {
        videoUrls: [
            { src: '/control_9x16.av1.mp4', type: 'video/mp4; codecs=av01.0.05M.08,opus' },
            { src: '/control_9x16.mp4', type: 'video/mp4' },
        ],
        imgSrc: '/control.webp',
        href: 'https://control.chipsa.ru/',
        color: '#f2f5f7',
    },
    {
        videoUrls: [
            { src: '/biotech_9x16.av1.mp4', type: 'video/mp4; codecs=av01.0.05M.08,opus' },
            { src: '/biotech_9x16.mp4', type: 'video/mp4' },
        ],
        imgSrc: '/biotech.webp',
        href: 'https://biotech.artlife.ru/',
        color: '#f5f5f5',
    },
    {
        videoUrls: [
            { src: '/sportex_9x16.av1.mp4', type: 'video/mp4; codecs=av01.0.05M.08,opus' },
            { src: '/sportex_9x16.mp4', type: 'video/mp4' },
        ],
        imgSrc: '/sportex.webp',
        href: 'https://xn--j1ahcfcef2g.xn--p1ai/',
        color: '#444',
    },
    {
        videoUrls: [
            { src: '/malinovka_9x16.av1.mp4', type: 'video/mp4; codecs=av01.0.05M.08,opus' },
            { src: '/malinovka_9x16.mp4', type: 'video/mp4' },
        ],
        imgSrc: '/malinovka.webp',
        href: 'https://24fermer.ru/',
        color: '#c5c5c5',
    },
    {
        videoUrls: [
            { src: '/asap_9x16.av1.mp4', type: 'video/mp4; codecs=av01.0.05M.08,opus' },
            { src: '/asap_9x16.mp4', type: 'video/mp4' },
        ],
        imgSrc: '/asap.webp',
        href: 'https://asap.digital/',
        color: '#222',
    },
];

const MainScene = () => {
    const projectStandRefs = useMapRefs<Group>(portfolio);
    const [hoveredStandIndex, setHoveredStandIndex] = useState<number | null>(null);
    const standWidth = 4.5;
    const standHeight = 8;
    const standGeometry = useMemo(() => new BoxGeometry(standWidth + 0.2, standHeight + 0.2, 0.3), []);
    const standMaterial = useMemo(() => new MeshBasicMaterial({ color: '#111' }), []);
    // const standMaterial = useMemo(() => new MeshStandardMaterial({ color: '#cbcbcb' }), []);

    const pointLight = useRef<PointLight>(null);
    const [mediaQueryDevice] = useMediaQueryDeviceState();

    return (
        <>
            <Suspense>
                <Suspense>
                    <Walls />
                </Suspense>
                {mediaQueryDevice === 'desktop' && (
                    <Suspense>
                        <Ground />
                    </Suspense>
                )}
            </Suspense>
            <ScrollControls horizontal damping={0} pages={portfolio.length} distance={0.5}>
                <CameraMovement light={pointLight} />
            </ScrollControls>

            {portfolio.map((project, i) => (
                <Stand
                    key={i}
                    ref={projectStandRefs.current[i]}
                    width={standWidth}
                    height={standHeight}
                    geometry={standGeometry}
                    material={standMaterial}
                    videoUrls={project.videoUrls}
                    imgSrc={project.imgSrc}
                    position={[10 * i, 2.1, -10]}
                    onPointerEnter={() => {
                        document.documentElement.style.cursor = 'pointer';
                        setHoveredStandIndex(i);
                    }}
                    onPointerLeave={() => {
                        document.documentElement.style.cursor = '';
                        setHoveredStandIndex(null);
                    }}
                    dimmed={hoveredStandIndex !== i}
                    color={project.color}
                    onClick={() => window.open(project.href, '_blank')}
                />
            ))}

            <pointLight ref={pointLight} position={[30, 55, -8]} color="#f5f5f5" intensity={0.62} distance={73} />
            <Preload all />
            <AdaptiveDpr pixelated />
        </>
    );
};

export default MainScene;
