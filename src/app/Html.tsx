'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useMediaQueryDeviceState } from '@/atoms/media-query-device';
import useIsomorphicLayoutEffect from '@/hooks/use-isomorphic-layout-effect';
import { calculateScrollbarWidth } from '@/utils/calculate-scrollbar-width';
import vhMobileFix from '@/utils/vh-mobile-fix';

if (typeof window !== 'undefined') {
    vhMobileFix();
    calculateScrollbarWidth();
}

const YM_ID = 93587310;

const Html = ({ children }: { children: ReactNode }) => {
    const [_, setMediaQueryDeviceState] = useMediaQueryDeviceState();
    const router = useRouter();

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

    useEffect(() => {
        (window as any).ym?.(YM_ID, 'hit', router.pathname);
    }, [router.pathname]);

    return (
        <html lang="en">
            {process.env.NODE_ENV === 'production' && (
                <div
                    dangerouslySetInnerHTML={{
                        __html: `
                    <script>
                    (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                    m[i].l=1*new Date();
                    for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
                    k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
                    (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
                 
                    ym(${YM_ID}, "init", {
                         defer: true,
                         clickmap:true,
                         trackLinks:true,
                         accurateTrackBounce:true
                    });
                 </script>
                 <noscript><div><img src="https://mc.yandex.ru/watch/${YM_ID}" style="position:absolute; left:-9999px;" alt="" /></div></noscript>
                    `,
                    }}
                ></div>
            )}
            {children}
        </html>
    );
};

export default Html;
