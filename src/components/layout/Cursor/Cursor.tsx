'use client';

import React, { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { Transition, TransitionStatus } from 'react-transition-group';
import { lerp } from '@/utils/lerp';
import { useCursorContentState, useCursorTypeState } from '@/atoms/cursor';
import { useDebounce } from '@/hooks/use-debounce';

const transitionDuration = 300;

const Cursor = () => {
    const el = useRef<HTMLDivElement>(null);
    const contentCursorInnerEl = useRef<HTMLDivElement>(null);
    const defaultCursorInnerEl = useRef<HTMLDivElement>(null);
    const closeCursorInnerEl = useRef<HTMLDivElement>(null);
    const linkCursorInnerEl = useRef<HTMLDivElement>(null);
    const rAF = useRef<number>(0);
    const mouse = useRef<{ x: number; y: number }>({
        x: typeof window === 'undefined' ? 0 : window.innerWidth / 2,
        y: typeof window === 'undefined' ? 0 : window.innerHeight / 2,
    });
    const lerpedMouse = useRef<{ x: number; y: number }>({
        x: typeof window === 'undefined' ? 0 : window.innerWidth / 2,
        y: typeof window === 'undefined' ? 0 : window.innerHeight / 2,
    });
    const [visible, setVisible] = useState(false);
    const [type] = useCursorTypeState();
    const [content] = useCursorContentState();
    const debouncedContent = useDebounce(content, transitionDuration);

    /**
     * По умолчанию курсор не видно. Показываем его при движении мыши
     */
    useEffect(() => {
        function revealCursor() {
            setVisible(true);
        }

        document.addEventListener('mousemove', revealCursor, { once: true });

        return () => {
            document.removeEventListener('mousemove', revealCursor);
        };
    }, []);

    useEffect(() => {
        function getMouseCoords(event: MouseEvent) {
            mouse.current.x = event.clientX;
            mouse.current.y = event.clientY;
        }

        document.addEventListener('mousemove', getMouseCoords);

        return () => {
            document.removeEventListener('mousemove', getMouseCoords);
        };
    }, []);

    useEffect(() => {
        function render() {
            lerpedMouse.current.x = lerp(lerpedMouse.current.x, mouse.current.x, 0.1);
            lerpedMouse.current.y = lerp(lerpedMouse.current.y, mouse.current.y, 0.1);

            if (el.current) {
                el.current.style.transform = `translate3d(${lerpedMouse.current.x}px, ${lerpedMouse.current.y}px, 0) translate3d(-50%, -50%, 0)`;
            }
        }

        function animate() {
            render();
            rAF.current = requestAnimationFrame(animate);
        }

        rAF.current = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(rAF.current);
        };
    }, []);

    return (
        <div ref={el} className={classNames('cursor', { 'cursor--hidden': !visible })}>
            <div ref={defaultCursorInnerEl} className="cursor__inner cursor__inner--default"></div>
        </div>
    );
};

export default Cursor;
