/* eslint-disable import/no-anonymous-default-export */
import { viewport } from '@/utils/viewport';
import debounce from 'lodash.debounce';

export default () => {
    const vh = viewport.height * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);

    const calculateVhOnResize = debounce(() => {
        const newVh = viewport.height * 0.01;
        document.documentElement.style.setProperty('--vh', `${newVh}px`);
    }, 50);



    window.addEventListener('resize', calculateVhOnResize);
    window.addEventListener('orientationchange', calculateVhOnResize);

    return () => {
        window.removeEventListener('resize', calculateVhOnResize);
        window.removeEventListener('orientationchange', calculateVhOnResize);
    };
};
