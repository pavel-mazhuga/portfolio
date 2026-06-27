import type { IExperiment } from './experiment.interface';

type ExperimentInput = Omit<IExperiment, 'preview' | 'sourceLink'>;

const experimentData: ExperimentInput[] = [
    {
        name: 'Shadowed particles',
        slug: 'shadowed-particles',
        tags: ['webgpu', 'tsl', 'shaders', 'particles'],
        seoTitle: 'Shadowed particles (hologram)',
        tip: 'Move cursor',
        active: false,
    },

    {
        name: 'Metaballs',
        slug: 'metaballs',
        tags: ['webgpu', 'tsl', 'shaders', 'raymarching', 'sdf'],
    },
    {
        name: 'Mesh particles destruction',
        slug: 'mesh-particles-destruction',
        tags: ['webgpu', 'tsl', 'shaders', 'particles'],
    },
    {
        name: 'Dissolve',
        slug: 'dissolve',
        tags: ['webgpu', 'tsl', 'shaders', 'particles'],
    },
    {
        name: 'Particles black hole',
        slug: 'particles-black-hole',
        tags: ['webgl', 'particles', 'shaders'],
    },
    {
        name: 'Snowflakes',
        slug: 'snowflakes',
        tags: ['webgl', 'particles', 'shaders'],
    },
    {
        name: 'Attraction and collisions',
        slug: 'attractor-collisions',
        tags: ['webgpu', 'tsl', 'shaders', 'compute'],
        seoTitle: 'Attractor and collisions',
    },
    {
        name: 'TSL custom node material',
        slug: 'tsl-custom-node-material',
        tags: ['webgpu', 'tsl', 'shaders'],
    },
    {
        name: 'Particles noised morphing',
        slug: 'particles-morphing-2',
        tags: ['webgpu', 'tsl', 'shaders', 'compute'],
        seoTitle: 'Particles morphing (WebGPU)',
        tip: 'Click',
    },
    {
        name: 'Magic wand',
        slug: 'magic-wand-cursor',
        tags: ['webgpu', 'tsl', 'shaders', 'compute'],
        seoTitle: 'Magic wand cursor',
    },
    {
        name: 'Flow field',
        slug: 'flow-field',
        tags: ['webgpu', 'tsl', 'shaders', 'compute'],
    },
    {
        name: 'Nightingale hover effect (recreated)',
        slug: 'nightingale-hover-effect-recreated',
        tags: ['webgpu', 'tsl', 'shaders'],
        seoTitle: 'Nightingale hover effect recreated',
        tip: 'Click',
    },
    {
        name: 'Infinite water',
        slug: 'infinite-water',
        tags: ['webgpu', 'tsl', 'shaders'],
        tip: 'Scroll',
    },
    {
        name: 'Particles twist',
        slug: 'particles-twist',
        tags: ['webgpu', 'tsl', 'shaders', 'particles', 'compute'],
        seoTitle: 'Particles Twist',
    },
    {
        name: 'Particles following cursor position',
        slug: 'particles-following-cursor-position',
        tags: ['webgl', 'shaders', 'particles'],
    },
    {
        name: 'Displaced sphere with extended three.js material',
        slug: 'displaced-sphere-csm',
        tags: ['webgl', 'shaders', 'displacement'],
    },
    {
        name: 'Displaced sphere v2',
        slug: 'displaced-sphere-2',
        tags: ['webgl', 'shaders', 'displacement'],
    },
    {
        name: 'Particles photo mouse trail',
        slug: 'particles-photo-mouse-trail',
        tags: ['webgl', 'shaders', 'particles'],
    },
    {
        name: 'Particles model shape',
        slug: 'particles-model-shape',
        tags: ['webgl', 'shaders', 'particles'],
    },
    {
        name: 'FBO particles morphing',
        slug: 'fbo-particles-morphing',
        tags: ['webgl', 'shaders', 'particles'],
    },
    {
        name: 'FBO particles',
        slug: 'fbo-particles',
        tags: ['webgl', 'shaders', 'particles'],
    },
    {
        name: 'GPU particles',
        slug: 'gpu-particles',
        tags: ['webgl', 'shaders', 'particles'],
    },
    {
        name: 'Displaced sphere',
        slug: 'displaced-sphere',
        tags: ['webgl', 'shaders', 'displacement'],
    },
    {
        name: 'Distorted scroller',
        slug: 'distorted-scroller',
        tags: ['webgl', 'shaders', 'slider'],
    },
    {
        name: 'Image transition',
        slug: 'image-transition',
        tags: ['webgl', 'shaders', 'transition', 'displacement'],
    },
    {
        name: 'Vertex wave animation',
        slug: 'vertex-wave-animation',
        tags: ['webgl', 'shaders', 'displacement'],
    },
    {
        name: 'Endless',
        slug: 'endless-1',
        tags: ['webgl', 'shaders'],
    },
    {
        name: 'Infinite UV animation',
        slug: 'sphere-infinite-uv',
        tags: ['webgl', 'shaders'],
    },
    {
        name: 'Particles on model surface',
        slug: 'particles-on-model-surface',
        tags: ['webgl', 'particles'],
    },
    {
        name: 'Flower-ish',
        slug: 'flower-ish',
        tags: ['webgl', 'shaders', 'displacement'],
    },
    {
        name: 'Refraction & dispersion',
        slug: 'refraction-and-dispersion',
        tags: ['webgl', 'shaders', 'refraction'],
    },
    {
        name: 'Animated blob',
        slug: 'animated-blob',
        tags: ['webgl', 'shaders'],
    },
    {
        name: 'Displaced torus',
        slug: 'displaced-torus',
        tags: ['webgl', 'shaders'],
    },
    {
        name: 'Plane wave',
        slug: 'plane-wave',
        tags: ['webgl', 'shaders'],
    },
];

const allExperiments: IExperiment[] = experimentData.map((item) => ({
    ...item,
    preview: {
        src: `/static/img/lab/${item.slug}/preview.jpeg`,
        width: 2160,
        height: 2160,
        alt: item.name,
    },
    sourceLink: `https://github.com/pavel-mazhuga/portfolio/tree/main/frontend/src/features/experiments/${item.slug}`,
}));

export const experiments = allExperiments;

export const listedExperiments = allExperiments.filter((item) => item.active !== false);
