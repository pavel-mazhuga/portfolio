import type { CommonPageProps } from '@/shared/model/types';

export const APP_TITLE = 'Pavel Mazhuga | Creative Frontend Developer';

export const getCommonPageProps = async (): Promise<Omit<CommonPageProps, 'breadcrumbs'>> => {
    return {
        meta: {
            title: APP_TITLE,
            description:
                'Creative frontend developer. Passionate about WebGL / WebGPU and related stuff, stunning motion and animations.',
            ogImage: '/static/img/og-image.jpg',
        },
    };
};
