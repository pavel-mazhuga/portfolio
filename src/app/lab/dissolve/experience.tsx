'use client';

import classNames from 'classnames';
import { useEffect, useRef } from 'react';
import { useMediaQuery } from 'usehooks-ts';
import { v4 as uuidv4 } from 'uuid';
import { useMounted } from '@/hooks/use-mounted';
import Demo from './Demo';

const Experience = () => {
    const hash = process.env.NODE_ENV === 'development' ? uuidv4() : undefined;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isHover = useMediaQuery('(any-hover: hover), (hover: hover) and (pointer: fine)');
    const isMobile = useMediaQuery('(max-width: 1199px)');
    const isMounted = useMounted();

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
            <div
                className={classNames('tip', {
                    'tip--top': isMounted && isMobile,
                })}
            >
                {isMounted && isHover ? 'Press SPACE' : 'CLICK'}
            </div>
        </>
    );
};

export default Experience;
