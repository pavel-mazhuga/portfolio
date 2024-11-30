'use client';

import { useEffect, useRef } from 'react';
import { useIsClient } from 'usehooks-ts';
import Demo from './demo';

const Experience = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isClient = useIsClient();

    useEffect(() => {
        let demo: Demo;

        if (isClient) {
            import('./demo').then((m) => {
                const Demo = m.default;
                demo = new Demo(canvasRef.current!);
            });
        }

        return () => {
            demo?.destroy();
        };
    }, [isClient]);

    return <canvas ref={canvasRef} className="responsive__item"></canvas>;
};

export default Experience;
