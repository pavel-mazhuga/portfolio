import { ImageShape } from '@/types';
import planeWavePreview from '@/app/lab/plane-wave/preview.jpeg';
import displacedTorusPreview from '@/app/lab/displaced-torus/preview.jpeg';
import animatedBlobPreview from '@/app/lab/animated-blob/preview.jpeg';
import refractionAndDispersionPreview from '@/app/lab/refraction-and-dispersion/preview.jpeg';
import flowerishPreview from '@/app/lab/flower-ish/preview.jpeg';
import particlesOnModelSurfacePreview from '@/app/lab/particles-on-model-surface/preview.jpeg';
import sphereInfiniteUvPreview from '@/app/lab/sphere-infinite-uv/preview.jpeg';
import endless1Preview from '@/app/lab/endless-1/preview.jpeg';
import vertexWavePreview from '@/app/lab/vertex-wave-animation/preview.jpeg';
import imageTransitionPreview from '@/app/lab/image-transition/preview.jpeg';
import distortedScrollerPreview from '@/app/lab/distorted-scroller/preview.jpeg';
import displacedSpherePreview from '@/app/lab/displaced-sphere/preview.jpeg';
import gpuParticlesPreview from '@/app/lab/gpu-particles/preview.jpeg';
import fboParticlesPreview from '@/app/lab/fbo-particles/preview.jpeg';
import fboParticlesMorphingPreview from '@/app/lab/fbo-particles-morphing/preview.jpeg';
import particlesModelShapePreview from '@/app/lab/particles-model-shape/preview.jpeg';
import particlesPhotoMouseTrailPreview from '@/app/lab/particles-photo-mouse-trail/preview.jpeg';
import displacedSphere2Preview from '@/app/lab/displaced-sphere-2/preview.jpeg';

export const experiments: { name: string; slug: string; tags: string[]; preview?: ImageShape }[] = [
    {
        name: 'Displaced-sphere-2',
        slug: 'displaced-sphere-2',
        tags: ['webgl', 'shaders', 'displacement'],
        preview: displacedSphere2Preview,
    },
    {
        name: 'Particles photo mouse trail',
        slug: 'particles-photo-mouse-trail',
        tags: ['webgl', 'shaders', 'particles'],
        preview: particlesPhotoMouseTrailPreview,
    },
    {
        name: 'Particles model shape',
        slug: 'particles-model-shape',
        tags: ['webgl', 'shaders', 'particles'],
        preview: particlesModelShapePreview,
    },
    {
        name: 'FBO particles morphing',
        slug: 'fbo-particles-morphing',
        tags: ['webgl', 'shaders', 'particles'],
        preview: fboParticlesMorphingPreview,
    },
    {
        name: 'FBO particles',
        slug: 'fbo-particles',
        tags: ['webgl', 'shaders', 'particles'],
        preview: fboParticlesPreview,
    },
    {
        name: 'GPU particles',
        slug: 'gpu-particles',
        tags: ['webgl', 'shaders', 'particles'],
        preview: gpuParticlesPreview,
    },
    {
        name: 'Displaced sphere',
        slug: 'displaced-sphere',
        tags: ['webgl', 'shaders', 'displacement'],
        preview: displacedSpherePreview,
    },
    {
        name: 'Distorted scroller',
        slug: 'distorted-scroller',
        tags: ['webgl', 'shaders', 'slider'],
        preview: distortedScrollerPreview,
    },
    {
        name: 'Image transition',
        slug: 'image-transition',
        tags: ['webgl', 'shaders', 'transition', 'displacement'],
        preview: imageTransitionPreview,
    },
    {
        name: 'Vertex wave animation',
        slug: 'vertex-wave-animation',
        tags: ['webgl', 'shaders', 'displacement'],
        preview: vertexWavePreview,
    },
    {
        name: 'Endless',
        slug: 'endless-1',
        tags: ['webgl', 'shaders'],
        preview: endless1Preview,
    },
    {
        name: 'Infinite UV animation',
        slug: 'sphere-infinite-uv',
        tags: ['webgl', 'shaders'],
        preview: sphereInfiniteUvPreview,
    },
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
    {
        name: 'Animated blob',
        slug: 'animated-blob',
        tags: ['webgl', 'shaders'],
        preview: animatedBlobPreview,
    },
    {
        name: 'Displaced torus',
        slug: 'displaced-torus',
        tags: ['webgl', 'shaders'],
        preview: displacedTorusPreview,
    },
    {
        name: 'Plane wave',
        slug: 'plane-wave',
        tags: ['webgl', 'shaders'],
        preview: planeWavePreview,
    },
];
