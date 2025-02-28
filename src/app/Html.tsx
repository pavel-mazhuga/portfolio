'use client';

import dynamic from 'next/dynamic';
import { ReactNode } from 'react';
import { useIsMounted } from 'usehooks-ts';
import { useMediaQueryDeviceState } from '@/atoms/media-query-device';
import useIsomorphicLayoutEffect from '@/hooks/use-isomorphic-layout-effect';
import { calculateScrollbarWidth } from '@/utils/calculate-scrollbar-width';
import vhMobileFix from '@/utils/vh-mobile-fix';

if (typeof window !== 'undefined') {
    vhMobileFix();
    calculateScrollbarWidth();
}

const LayoutGrid = dynamic(() => import('@/app/components/utils/LayoutGrid'), { ssr: false });

const Html = ({ children }: { children: ReactNode }) => {
    const [_, setMediaQueryDeviceState] = useMediaQueryDeviceState();
    const isMounted = useIsMounted();

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
        <html lang="en">
            {children}
            {process.env.NODE_ENV === 'development' && isMounted() && (
                <>
                    <LayoutGrid />
                </>
            )}
        </html>
    );
};

export default Html;
