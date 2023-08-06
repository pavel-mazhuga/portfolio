import { ImageShape } from '@/types';
import planeWavePreview from '@/app/lab/plane-wave/preview.jpeg';
import displacedTorusPreview from '@/app/lab/displaced-torus/preview.jpeg';
import animatedBlobPreview from '@/app/lab/animated-blob/preview.jpeg';

export const experiments: { name: string; slug: string; preview?: ImageShape }[] = [
    { name: 'Plane wave', slug: 'plane-wave', preview: planeWavePreview },
    { name: 'Displaced torus', slug: 'displaced-torus', preview: displacedTorusPreview },
    { name: 'Animated blob', slug: 'animated-blob', preview: animatedBlobPreview },
];
