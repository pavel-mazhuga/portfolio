import animatedBlobPreview from '@/app/lab/animated-blob/preview.jpeg';
import attractorCollisionsPreview from '@/app/lab/attractor-collisions/webgpu/preview.jpeg';
import displacedSphere2Preview from '@/app/lab/displaced-sphere-2/preview.jpeg';
import displacedSphereCsmPreview from '@/app/lab/displaced-sphere-csm/preview.jpeg';
import displacedSpherePreview from '@/app/lab/displaced-sphere/preview.jpeg';
import displacedTorusPreview from '@/app/lab/displaced-torus/preview.jpeg';
import dissolvePreview from '@/app/lab/dissolve/preview.jpeg';
import distortedScrollerPreview from '@/app/lab/distorted-scroller/preview.jpeg';
import endless1Preview from '@/app/lab/endless-1/preview.jpeg';
import fboParticlesMorphingPreview from '@/app/lab/fbo-particles-morphing/preview.jpeg';
import fboParticlesPreview from '@/app/lab/fbo-particles/preview.jpeg';
import flowFieldPreview from '@/app/lab/flow-field/webgpu/preview.jpeg';
import flowerishPreview from '@/app/lab/flower-ish/preview.jpeg';
import gpuParticlesPreview from '@/app/lab/gpu-particles/preview.jpeg';
import imageTransitionPreview from '@/app/lab/image-transition/preview.jpeg';
import infiniteWaterPreview from '@/app/lab/infinite-water/webgpu/preview.jpeg';
import magicWandCursorPreview from '@/app/lab/magic-wand-cursor/webgpu/preview.jpeg';
import meshParticlesDestructionPreview from '@/app/lab/mesh-particles-destruction/preview.jpeg';
import nightingaleHoverEffectRecreatedPreview from '@/app/lab/nightingale-hover-effect-recreated/webgpu/preview.jpeg';
import particlesBlackHolePreview from '@/app/lab/particles-black-hole/preview.jpeg';
import particlesFollowingCursorPositionPreview from '@/app/lab/particles-following-cursor-position/preview.jpeg';
import particlesModelShapePreview from '@/app/lab/particles-model-shape/preview.jpeg';
import particlesMorphing2Preview from '@/app/lab/particles-morphing-2/webgpu/preview.jpeg';
import particlesOnModelSurfacePreview from '@/app/lab/particles-on-model-surface/preview.jpeg';
import particlesPhotoMouseTrailPreview from '@/app/lab/particles-photo-mouse-trail/preview.jpeg';
import particlesTwistPreview from '@/app/lab/particles-twist/preview.jpeg';
import planeWavePreview from '@/app/lab/plane-wave/preview.jpeg';
import refractionAndDispersionPreview from '@/app/lab/refraction-and-dispersion/preview.jpeg';
import snowflakesPreview from '@/app/lab/snowflakes/preview.jpeg';
import sphereInfiniteUvPreview from '@/app/lab/sphere-infinite-uv/preview.jpeg';
import tslCustomNodeMatealPreview from '@/app/lab/tsl-custom-node-material/preview.jpeg';
import vertexWavePreview from '@/app/lab/vertex-wave-animation/preview.jpeg';
import { ImageShape } from '@/types';

export const experiments: { name: string; slug: string; tags: string[]; preview?: ImageShape }[] = [
    {
        name: 'Mesh particles destruction',
        slug: 'mesh-particles-destruction',
        tags: ['webgpu', 'tsl', 'shaders', 'particles'],
        preview: meshParticlesDestructionPreview,
    },
    {
        name: 'Dissolve',
        slug: 'dissolve',
        tags: ['webgpu', 'tsl', 'shaders', 'particles'],
        preview: dissolvePreview,
    },
    {
        name: 'Particles black hole',
        slug: 'particles-black-hole',
        tags: ['webgl', 'particles', 'shaders'],
        preview: particlesBlackHolePreview,
    },
    { name: 'Snowflakes', slug: 'snowflakes', tags: ['webgl', 'particles', 'shaders'], preview: snowflakesPreview },
    {
        name: 'Attraction and collisions',
        slug: 'attractor-collisions/webgpu',
        tags: ['webgpu', 'tsl', 'shaders', 'compute'],
        preview: attractorCollisionsPreview,
    },
    {
        name: 'TSL custom node material',
        slug: 'tsl-custom-node-material',
        tags: ['webgpu', 'tsl', 'shaders'],
        preview: tslCustomNodeMatealPreview,
    },
    {
        name: 'Particles noised morphing',
        slug: 'particles-morphing-2/webgpu',
        tags: ['webgpu', 'tsl', 'shaders', 'compute'],
        preview: particlesMorphing2Preview,
    },
    {
        name: 'Magic wand',
        slug: 'magic-wand-cursor/webgpu',
        tags: ['webgpu', 'tsl', 'shaders', 'compute'],
        preview: magicWandCursorPreview,
    },
    {
        name: 'Flow field',
        slug: 'flow-field/webgpu',
        tags: ['webgpu', 'tsl', 'shaders', 'compute'],
        preview: flowFieldPreview,
    },
    {
        name: 'Nightingale hover effect (recreated)',
        slug: 'nightingale-hover-effect-recreated/webgpu',
        tags: ['webgpu', 'tsl', 'shaders'],
        preview: nightingaleHoverEffectRecreatedPreview,
    },
    {
        name: 'Infinite water',
        slug: 'infinite-water/webgpu',
        tags: ['webgpu', 'tsl', 'shaders'],
        preview: infiniteWaterPreview,
    },
    {
        name: 'Particles twist',
        slug: 'particles-twist',
        tags: ['webgl', 'shaders', 'particles', 'gpgpu', 'compute'],
        preview: particlesTwistPreview,
    },
    {
        name: 'Particles following cursor position',
        slug: 'particles-following-cursor-position',
        tags: ['webgl', 'shaders', 'particles'],
        preview: particlesFollowingCursorPositionPreview,
    },
    {
        name: 'Displaced sphere with extended three.js material',
        slug: 'displaced-sphere-csm',
        tags: ['webgl', 'shaders', 'displacement'],
        preview: displacedSphereCsmPreview,
    },
    {
        name: 'Displaced sphere v2',
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
    { name: 'Endless', slug: 'endless-1', tags: ['webgl', 'shaders'], preview: endless1Preview },
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
    { name: 'Flower-ish', slug: 'flower-ish', tags: ['webgl', 'shaders', 'displacement'], preview: flowerishPreview },
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
