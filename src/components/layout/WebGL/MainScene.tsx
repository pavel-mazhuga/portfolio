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

const useWheel = () => {
    const ONE_STAND_SCROLL_LENGTH = 2860;
    const startTouchX = useRef<number>(0);
    const startTouchY = useRef<number>(0);
    const prevDeltaX = useRef<number>(0);
    const prevDeltaY = useRef<number>(0);
    const wheelX = useRef<number>(0);
    const wheelY = useRef<number>(0);

    useEffect(() => {
        const onWheel = (event: WheelEvent) => {
            const delta = event.deltaY === 0 ? event.deltaX : event.deltaY;
            wheelX.current = clamp(wheelX.current + delta, 0, ONE_STAND_SCROLL_LENGTH * portfolio.length);
        };

        window.addEventListener('wheel', onWheel);

        return () => window.removeEventListener('wheel', onWheel);
    }, []);

    useEffect(() => {
        const onTouchstart = (event: TouchEvent) => {
            startTouchX.current = event.touches[0].clientX;
            startTouchY.current = event.touches[0].clientY;
        };

        const hasScrollDirectionChanged = (prevY: number, currentY: number) => {
            if (prevDeltaY.current > 0) {
                return currentY < prevY;
            } else if (prevDeltaY.current < 0) {
                return currentY > prevY;
            }

            return false;
        };

        const onTouchmove = (event: TouchEvent) => {
            let deltaX = startTouchX.current - event.touches[0].clientX;
            console.log({ deltaX });
            let deltaY = startTouchY.current - event.touches[0].clientY;

            if (hasScrollDirectionChanged(prevDeltaY.current, deltaY)) {
                deltaX = 0;
                deltaY = 0;
                startTouchX.current = event.touches[0].clientX;
                startTouchY.current = event.touches[0].clientY;
            }

            const delta = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;
            wheelX.current = clamp(wheelX.current + delta, 0, ONE_STAND_SCROLL_LENGTH * portfolio.length);
            prevDeltaX.current = deltaX;
            prevDeltaY.current = deltaY;
        };

        window.addEventListener('touchstart', onTouchstart);
        window.addEventListener('touchmove', onTouchmove);

        return () => {
            window.removeEventListener('touchstart', onTouchstart);
            window.removeEventListener('touchmove', onTouchmove);
        };
    }, []);

    return { wheelX, wheelY };
};

const MainScene = () => {
    const projectStandRefs = useMapRefs<Mesh>(portfolio);
    const { wheelX } = useWheel();

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
