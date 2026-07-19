import { WEBSITE_METADATA } from '@/shared/config/website-metadata';
import type { CommonPageProps } from '@/shared/model/types';

export const APP_TITLE = WEBSITE_METADATA.name;

export const getCommonPageProps = async (): Promise<Omit<CommonPageProps, 'breadcrumbs'>> => {
    return {
        meta: {
            title: WEBSITE_METADATA.name,
            description:
                'Creative frontend developer. Passionate about WebGL / WebGPU and related stuff, stunning motion and animations.',
            ogImage: '/static/img/og-image.jpg',
        },
    };
};
