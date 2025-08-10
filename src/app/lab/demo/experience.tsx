'use client';

import { useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Demo from './Demo';

const Experience = () => {
    const hash = process.env.NODE_ENV === 'development' ? uuidv4() : undefined;
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (canvasRef.current) {
            const demo = new Demo(canvasRef.current!);

            return () => {
                demo.destroy();
            };
        }
    }, [hash]);

    return <canvas ref={canvasRef} className="responsive__item"></canvas>;
};

export default Experience;
