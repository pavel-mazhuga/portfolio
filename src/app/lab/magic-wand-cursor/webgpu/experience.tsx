'use client';

import { useEffect, useRef } from 'react';
import Demo from './demo';

const Experience = () => {
    const experienceStr = Demo.toString();
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (canvasRef.current) {
            const demo = new Demo(canvasRef.current!);

            return () => {
                demo.destroy();
            };
        }
    }, [experienceStr]);

    return <canvas ref={canvasRef} className="responsive__item"></canvas>;
};

export default Experience;
