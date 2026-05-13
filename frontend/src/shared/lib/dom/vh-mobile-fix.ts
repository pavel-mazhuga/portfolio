import debounce from 'lodash.debounce';
import { isMobileDevice, isTelegramWebView } from './mobile';

const DEBOUNCE_TIME = 50;

export default () => {
    let maxVh = 0;

    const setVh = () => {
        const vh = window.innerHeight * 0.01;

        document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    function setMobileVh() {
        document.body.classList.add('telegram-web-view');
        const visualHeight = window.visualViewport?.height || window.innerHeight;
        const unusedHeight = visualHeight - window.innerHeight;
        const realHeight = window.screen.height - unusedHeight;
        const vh = realHeight * 0.01;
        const minVh = window.innerHeight * 0.01;

        if (vh > maxVh) {
            maxVh = vh;
            document.documentElement.style.setProperty('--mobile-vh', `${vh}px`);
            document.documentElement.style.setProperty('--mobile-difference-minvh-vh', `${(vh - minVh) * 100}px`);
        }
    }

    const calculateVhOnResize = debounce(setVh, DEBOUNCE_TIME);
    const handleEvents = () => {
        if (isTelegramWebView() && isMobileDevice()) setMobileVh();
    };

    window.addEventListener('resize', calculateVhOnResize);
    window.addEventListener('load', calculateVhOnResize);
    window.addEventListener('orientationchange', calculateVhOnResize);
    handleEvents();

    return () => {
        window.removeEventListener('resize', calculateVhOnResize);
        window.removeEventListener('orientationchange', calculateVhOnResize);
    };
};
