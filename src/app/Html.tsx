'use client';

import { ReactNode, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { pathnameClassMap } from './pathname-class-map';
import { useMediaQueryDeviceState } from '@/atoms/media-query-device';
import useIsomorphicLayoutEffect from '@/hooks/use-isomorphic-layout-effect';
import { calculateScrollbarWidth } from '@/utils/calculate-scrollbar-width';
import vhMobileFix from '@/utils/vh-mobile-fix';
import { deleteGetParams } from '@/utils/strings';

if (typeof window !== 'undefined') {
    vhMobileFix();
    calculateScrollbarWidth();
}

const Html = ({ children }: { children: ReactNode }) => {
    const pathname = usePathname();
    const [_, setMediaQueryDeviceState] = useMediaQueryDeviceState();

    useEffect(() => {
        const pageClass = pathnameClassMap.get(deleteGetParams(pathname));

        if (pageClass) {
            document.documentElement.classList.add(pageClass);
        }

        return () => {
            if (pageClass) {
                document.documentElement.classList.remove(pageClass);
            }
        };
    }, [pathname]);

    useIsomorphicLayoutEffect(() => {
        const setDevice = () => {
            switch (true) {
                case matchMedia('(max-width: 767px)').matches:
                    setMediaQueryDeviceState('vertical-mobile');
                    break;
                case matchMedia('(max-width: 900px) and (orientation: landscape)').matches:
                    setMediaQueryDeviceState('horizontal-mobile');
                    break;
                case matchMedia('(min-width: 768px) and (max-width: 1199px) and (orientation: portrait)').matches:
                    setMediaQueryDeviceState('vertical-tablet');
                    break;
                case matchMedia('(min-width: 768px) and (max-width: 1199px) and (orientation: landscape)').matches:
                    setMediaQueryDeviceState('horizontal-tablet');
                    break;
                default:
                    setMediaQueryDeviceState('desktop');
                    break;
            }
        };

        const onResize = () => {
            setDevice();
        };

        onResize();
        window.addEventListener('resize', onResize);

        return () => window.removeEventListener('resize', setDevice);
    }, [setMediaQueryDeviceState]);

    return (
        <html lang="ru" className={pathnameClassMap.get(deleteGetParams(pathname))}>
            {children}
        </html>
    );
};

export default Html;
