import { ImageShape } from '@/types';
import planeWavePreview from '@/app/lab/plane-wave/preview.jpeg';
import displacedTorusPreview from '@/app/lab/displaced-torus/preview.jpeg';
import animatedBlobPreview from '@/app/lab/animated-blob/preview.jpeg';
import refractionAndDispersionPreview from '@/app/lab/refraction-and-dispersion/preview.jpeg';
import flowerishPreview from '@/app/lab/flower-ish/preview.jpeg';
import particlesOnModelSurfacePreview from '@/app/lab/particles-on-model-surface/preview.jpeg';

export const experiments: { name: string; slug: string; tags: string[]; preview?: ImageShape }[] = [
    {
        name: 'Particles on model surface',
        slug: 'particles-on-model-surface',
        tags: ['webgl', 'particles'],
        preview: particlesOnModelSurfacePreview,
    },
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
