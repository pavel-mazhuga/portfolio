import { ImageShape } from '@/types';
import planeWavePreview from '@/app/lab/plane-wave/preview.jpeg';
import displacedTorusPreview from '@/app/lab/displaced-torus/preview.jpeg';
import animatedBlobPreview from '@/app/lab/animated-blob/preview.jpeg';
import refractionAndDispersionPreview from '@/app/lab/refraction-and-dispersion/preview.jpeg';
import flowerishPreview from '@/app/lab/flowerish/preview.jpeg';

export const experiments: { name: string; slug: string; tags: string[]; preview?: ImageShape }[] = [
    {
        name: 'Flower-ish',
        slug: 'flower-ish',
        tags: ['webgl', 'shaders', 'displacement'],
        preview: flowerishPreview,
    },
    {
        name: 'Refraction & dispersion',
        slug: 'refraction-and-dispersion',
        tags: ['webgl', 'shaders', 'refraction'],
        preview: refractionAndDispersionPreview,
    },
    { name: 'Animated blob', slug: 'animated-blob', tags: ['webgl', 'shaders'], preview: animatedBlobPreview },
    { name: 'Displaced torus', slug: 'displaced-torus', tags: ['webgl', 'shaders'], preview: displacedTorusPreview },
    { name: 'Plane wave', slug: 'plane-wave', tags: ['webgl', 'shaders'], preview: planeWavePreview },
];
