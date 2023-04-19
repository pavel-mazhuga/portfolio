'use client';

import { useMapRefs } from '@/hooks/use-map-refs';
import { clamp } from '@/utils/clamp';
import { lerp } from '@/utils/lerp';
import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import { BackSide, Group, Object3D, PointLight, Vector3 } from 'three';
import Ground from './Ground';
import Stand from './Stand';

const portfolio = [
    {
        videoUrl: '/zagranitsa_9x16.mp4',
        href: 'https://zagranitsa.chipsa.ru',
        color: '#444',
    },
    {
        videoUrl: '/chipsa_9x16.mp4',
        href: 'https://chipsa.design',
        color: '#f2f5f7',
    },
    {
        videoUrl: '/control_9x16.mp4',
        href: 'https://control.chipsa.ru/',
        color: '#f2f5f7',
    },
    {
        videoUrl: '/biotech_9x16.mp4',
        href: 'https://biotech.artlife.ru/',
        color: '#f5f5f5',
    },
    {
        videoUrl: '/sportex_9x16.mp4',
        href: 'https://xn--j1ahcfcef2g.xn--p1ai/',
        color: '#444',
    },
    {
        videoUrl: '/malinovka_9x16.mp4',
        href: 'https://24fermer.ru/',
        color: '#c5c5c5',
    },
    {
        videoUrl: '/asap_9x16.mp4',
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
    const projectStandRefs = useMapRefs<Group>(portfolio);
    const { wheelX } = useWheel();
    const [hoveredStandIndex, setHoveredStandIndex] = useState<number | null>(null);
    const [floor, normal] = useTexture([
        '/img/34TX-SurfaceImperfections003_1K_var1.jpg',
        '/img/Soy5-SurfaceImperfections003_1K_Normal.jpg',
    ]);
    const pointLight = useRef<PointLight>(null);
    const cameraLookAtObject = useRef<Object3D>(null);
    const cameraLookAtObjectPosition = useRef(new Vector3());

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
            <mesh position={[30, 22, 0]}>
                <boxGeometry args={[90, 50, 50]} />
                <meshStandardMaterial color="lightblue" side={BackSide} normalMap={normal} roughnessMap={floor} />
            </mesh>

            {portfolio.map((project, i) => (
                <Stand
                    ref={projectStandRefs.current[i]}
                    key={i}
                    videoUrl={project.videoUrl}
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

            <Ground />

            <object3D ref={cameraLookAtObject} />

            <pointLight ref={pointLight} position={[30, 55, -8]} color="#f5f5f5" intensity={0.62} distance={73} />
        </>
    );
};

export default MainScene;
