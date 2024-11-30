'use client';

import { useEffect, useRef } from 'react';
import { useIsClient } from 'usehooks-ts';
import Demo from './demo';
import styles from './styles.module.scss';

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

    return (
        <>
            <canvas ref={canvasRef} className="responsive__item"></canvas>
            <div className={styles.tip}>SCROLL</div>
        </>
    );
};

export default Experience;
