/* eslint-disable @next/next/no-before-interactive-script-outside-document */
'use client';

import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { useEffect } from 'react';

/* eslint-disable @next/next/no-before-interactive-script-outside-document */

export const YM_ID = 93587310;

const Metrics = () => {
    const pathname = usePathname();

    useEffect(() => {
        (window as any).ym?.(YM_ID, 'hit', pathname);
    }, [pathname]);

    return (
        <head>
            <Script
                id="yandex_metrica"
                strategy="beforeInteractive"
                async
                dangerouslySetInnerHTML={{
                    __html: `
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
        `,
                }}
            ></Script>
        </head>
    );
};

export default Metrics;
