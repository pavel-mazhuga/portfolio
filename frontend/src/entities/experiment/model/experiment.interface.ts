import type { ImageShape } from '@/shared/model/types';

export type IExperiment = {
    slug: string;
    name: string;
    preview: ImageShape;
    tags: string[];
    sourceLink: string;
    tip?: string;
    seoTitle?: string;
    seoDescription?: string;
    active?: boolean;
};
