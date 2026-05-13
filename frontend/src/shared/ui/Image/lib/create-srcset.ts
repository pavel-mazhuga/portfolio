import imageLoader from './image-loader';

export const createSrcset = (src: string, widths: number[], quality: number, format: string) => {
    return widths
        .map((w) => {
            const optimizedSrc = imageLoader({ src, width: w, quality, format });

            return `${optimizedSrc} ${w}w`;
        })
        .join(', ');
};
