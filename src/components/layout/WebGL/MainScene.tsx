'use client';

import { useFrame } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { BoxGeometry, Group, MeshBasicMaterial, Object3D, PointLight, Vector3 } from 'three';
import { useMapRefs } from '@/hooks/use-map-refs';
import { clamp } from '@/utils/clamp';
import { lerp } from '@/utils/lerp';
import Ground from './Ground';
import Stand from './Stand';
import Walls from './Walls';
import { Preload, usePerformanceMonitor } from '@react-three/drei';

const portfolio = [
    {
        videoUrls: [
            { src: '/zagranitsa_9x16.av1.mp4', type: 'video/mp4; codecs=av01.0.05M.08,opus' },
            { src: '/zagranitsa_9x16.mp4', type: 'video/mp4' },
        ],
        href: 'https://zagranitsa.chipsa.ru',
        color: '#444',
    },
    {
        videoUrls: [
            { src: '/chipsa_9x16.av1.mp4', type: 'video/mp4; codecs=av01.0.05M.08,opus' },
            { src: '/chipsa_9x16.mp4', type: 'video/mp4' },
        ],
        href: 'https://chipsa.design',
        color: '#f2f5f7',
    },
    {
        videoUrls: [
            { src: '/control_9x16.av1.mp4', type: 'video/mp4; codecs=av01.0.05M.08,opus' },
            { src: '/control_9x16.mp4', type: 'video/mp4' },
        ],
        href: 'https://control.chipsa.ru/',
        color: '#f2f5f7',
    },
    {
        videoUrls: [
            { src: '/biotech_9x16.av1.mp4', type: 'video/mp4; codecs=av01.0.05M.08,opus' },
            { src: '/biotech_9x16.mp4', type: 'video/mp4' },
        ],
        href: 'https://biotech.artlife.ru/',
        color: '#f5f5f5',
    },
    {
        videoUrls: [
            { src: '/sportex_9x16.av1.mp4', type: 'video/mp4; codecs=av01.0.05M.08,opus' },
            { src: '/sportex_9x16.mp4', type: 'video/mp4' },
        ],
        href: 'https://xn--j1ahcfcef2g.xn--p1ai/',
        color: '#444',
    },
    {
        videoUrls: [
            { src: '/malinovka_9x16.av1.mp4', type: 'video/mp4; codecs=av01.0.05M.08,opus' },
            { src: '/malinovka_9x16.mp4', type: 'video/mp4' },
        ],
        href: 'https://24fermer.ru/',
        color: '#c5c5c5',
    },
    {
        videoUrls: [
            { src: '/asap_9x16.av1.mp4', type: 'video/mp4; codecs=av01.0.05M.08,opus' },
            { src: '/asap_9x16.mp4', type: 'video/mp4' },
        ],
        href: 'https://asap.digital/',
        color: '#222',
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
            const delta = (event.deltaY === 0 ? event.deltaX : event.deltaY) * 2;
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
            let deltaY = startTouchY.current - event.touches[0].clientY;

            if (hasScrollDirectionChanged(prevDeltaY.current, deltaY)) {
                deltaX = 0;
                deltaY = 0;
                startTouchX.current = event.touches[0].clientX;
                startTouchY.current = event.touches[0].clientY;
            }

            const delta = (Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY) * 2;
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
    const projectStandRefs = useMapRefs<Group>(portfolio);
    const { wheelX } = useWheel();
    const [hoveredStandIndex, setHoveredStandIndex] = useState<number | null>(null);
    const standWidth = 4.5;
    const standHeight = 8;
    const standGeometry = useMemo(() => new BoxGeometry(standWidth + 0.2, standHeight + 0.2, 0.3), []);
    const standMaterial = useMemo(() => new MeshBasicMaterial({ color: '#111' }), []);
    // const standMaterial = useMemo(() => new MeshStandardMaterial({ color: '#cbcbcb' }), []);

    const pointLight = useRef<PointLight>(null);
    const cameraLookAtObject = useRef<Object3D>(null);
    const cameraLookAtObjectPosition = useRef(new Vector3());
    const [groundHidden, setGroundHidden] = useState(false);

    usePerformanceMonitor({
        onChange: ({ factor }) => {
            setGroundHidden(factor < 0.4);
        },
    });

    useFrame(({ camera, pointer }) => {
        camera.position.x = lerp(camera.position.x, wheelX.current * 0.003, 0.07);

        // if (
        //     typeof hoveredStandIndex === 'number' &&
        //     projectStandRefs.current[hoveredStandIndex].current instanceof Mesh
        // ) {
        //     cameraLookAtObjectPosition.current.x = projectStandRefs.current[hoveredStandIndex].current!.position.x;
        // } else {
        cameraLookAtObjectPosition.current.x = camera.position.x;
        cameraLookAtObjectPosition.current.y = 2;
        cameraLookAtObjectPosition.current.z = 0;
        // }

        if (cameraLookAtObject.current) {
            cameraLookAtObject.current.position.lerp(cameraLookAtObjectPosition.current, 0.08);
            camera.lookAt(cameraLookAtObject.current.position);
        }

        if (pointLight.current) {
            pointLight.current.position.x = lerp(pointLight.current.position.x, camera.position.x, 0.02);
        }

        // camera.position.z = lerp(camera.position.z, typeof hoveredStandIndex === 'number' ? 15 : 20, 0.02);
        // camera.rotation.y = lerp(camera.rotation.y, typeof hoveredStandIndex === 'number' ? 0.1 : 0, 0.02);
    });

    return (
        <>
            <Suspense>
                <Suspense>
                    <Walls />
                </Suspense>
                {!groundHidden && (
                    <Suspense>
                        <Ground />
                    </Suspense>
                )}
            </Suspense>

            {portfolio.map((project, i) => (
                <Stand
                    key={i}
                    ref={projectStandRefs.current[i]}
                    width={standWidth}
                    height={standHeight}
                    geometry={standGeometry}
                    material={standMaterial}
                    videoUrls={project.videoUrls}
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

            <object3D ref={cameraLookAtObject} />
            <pointLight ref={pointLight} position={[30, 55, -8]} color="#f5f5f5" intensity={0.62} distance={73} />

            <Preload all />
        </>
    );
};

export default MainScene;
