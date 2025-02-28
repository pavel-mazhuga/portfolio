'use client';

import { useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Demo from './demo';

const Experience = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const hash = process.env.NODE_ENV === 'development' ? uuidv4() : undefined;

    useEffect(() => {
        if (canvasRef.current) {
            const demo = new Demo(canvasRef.current!);

            return () => {
                demo.destroy();
            };
        }
    }, [hash]);

    return (
        <>
            <canvas ref={canvasRef} className="responsive__item"></canvas>
            <div className="tip">CLICK</div>
        </>
    );
};

export default Experience;
