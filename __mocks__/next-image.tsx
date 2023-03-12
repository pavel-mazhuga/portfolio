import * as nextImage from 'next/image';

export const mockNextImage = () =>
    Object.defineProperty(nextImage, 'default', {
        configurable: true,
        value: (props: any) => <img {...props} />,
    });
