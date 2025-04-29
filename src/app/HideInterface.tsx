'use client';

import { useEffect, useState } from 'react';

const HideInterface = () => {
    const [hidden, setHidden] = useState(false);

    useEffect(() => {
        const onKeydown = (event: KeyboardEvent) => {
            if (event.code === 'KeyP') {
                setHidden((prevHidden) => !prevHidden);
            }
        };

        document.addEventListener('keydown', onKeydown);

        return () => document.removeEventListener('keydown', onKeydown);
    }, []);

    useEffect(() => {
        [
            ...document.querySelectorAll<HTMLElement>(
                '.header, .footer, .experiment__top, #leva__root, .leva-wrapper, .r3f-perf, .tp-dfwv, .tip, .canvas-wrapper > div:not([class] > canvas)',
            ),
        ].forEach((el) => {
            if (el) {
                el.hidden = hidden;
            }
        });
    }, [hidden]);

    return null;
};

export default HideInterface;
