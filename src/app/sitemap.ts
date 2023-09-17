import { MetadataRoute } from 'next';
import { experiments } from '@/app/lab/data';

const HOST = process.env.NEXT_PUBLIC_HOST || '';

export default function sitemap(): MetadataRoute.Sitemap {
    const lastModified = new Date();

    return [
        {
            url: HOST,
            lastModified,
        },
        {
            url: `${HOST}/lab`,
            lastModified: lastModified.toISOString(),
        },
        ...experiments.map((experiment) => ({
            url: `${HOST}/lab/${experiment.slug}`,
            lastModified: lastModified.toISOString(),
        })),
    ];
}
