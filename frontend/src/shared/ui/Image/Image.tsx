import { widths } from './const';
import { createSrcset } from './lib/create-srcset';
import imageLoader from './lib/image-loader';

export type Props = React.HTMLAttributes<HTMLImageElement> & {
    src: string;
    alt: string;
    width: number;
    height: number;
    format?: 'webp' | 'avif';
    quality?: number;
    loading?: 'lazy' | 'eager';
    decoding?: 'async' | 'sync' | 'auto';
    sizes?: string;
    resize?: boolean;
    priority?: boolean;
    widths?: number[];
};

const Image = ({
    src,
    alt,
    width,
    height,
    format = 'webp',
    quality = 80,
    loading = 'lazy',
    decoding = 'async',
    sizes = '100vw',
    priority = false,
    ...props
}: Props) => {
    const optimizedSrc = imageLoader({ src, width, quality, format });
    const srcset = createSrcset(src, widths, quality, format);

    return (
        <img
            {...props}
            src={optimizedSrc}
            srcSet={srcset}
            alt={alt}
            width={width}
            height={height}
            loading={priority ? 'eager' : loading}
            decoding={decoding}
            sizes={sizes}
            fetchPriority={priority ? 'high' : undefined}
        />
    );
};

export default Image;
