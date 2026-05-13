import path from 'path';
import { CDN_DOMAIN, fromCDN } from '@/shared/lib/cdn';

export default function imageLoader({
    src,
    width,
    quality = 80,
    format = 'webp',
}: {
    src: string;
    width: number;
    quality?: number;
    format?: string;
}): string {
    const { ext } = path.parse(src);
    const finalSrc = src.startsWith(CDN_DOMAIN) ? src.replace(CDN_DOMAIN, '') : src;

    return fromCDN(
        /(png|jpe?g|webp|avif)/.test(ext)
            ? `/api/optimize/?src=${encodeURIComponent(finalSrc)}&w=${width}&q=${quality}&format=${format}`
            : src,
    );
}
