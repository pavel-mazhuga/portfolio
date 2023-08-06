import { ImageShape } from '@/types';
import planeWavePreview from '@/app/lab/plane-wave/preview.jpeg';
import displacedTorusPreview from '@/app/lab/displaced-torus/preview.jpeg';
import animatedBlobPreview from '@/app/lab/animated-blob/preview.jpeg';

export const experiments: { name: string; slug: string; tags: string[]; preview?: ImageShape }[] = [
    { name: 'Plane wave', slug: 'plane-wave', tags: ['webgl', 'shaders'], preview: planeWavePreview },
    { name: 'Displaced torus', slug: 'displaced-torus', tags: ['webgl', 'shaders'], preview: displacedTorusPreview },
    { name: 'Animated blob', slug: 'animated-blob', tags: ['webgl', 'shaders'], preview: animatedBlobPreview },
];
