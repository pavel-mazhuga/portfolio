import type { IExperiment } from './experiment.interface';

type ExperimentInput = Omit<IExperiment, 'preview' | 'sourceLink'>;

const experimentData: ExperimentInput[] = [
    {
        name: 'Shadowed particles',
        slug: 'shadowed-particles',
        tags: ['webgpu', 'tsl', 'shaders', 'particles'],
        seoTitle: 'Shadowed particles (hologram)',
        seoDescription:
            'Holographic shadowed particle field driven by the cursor. WebGPU raymarching demo with Three.js TSL shaders.',
        tip: 'Move pointer',
        active: false,
    },
    {
        name: 'Flowmap',
        slug: 'flowmap',
        tags: ['webgpu', 'tsl', 'shaders', 'postprocessing'],
        seoDescription: 'Pointer-driven flowmap distorts a texture. WebGPU post-processing with TSL.',
        tip: 'Move pointer',
    },
    {
        name: 'Metaballs',
        slug: 'metaballs',
        tags: ['webgpu', 'tsl', 'shaders', 'raymarching', 'sdf'],
        seoDescription: 'Organic metaball blobs raymarched in real time. WebGPU SDF scene built with Three.js TSL.',
    },
    {
        name: 'Mesh particles destruction',
        slug: 'mesh-particles-destruction',
        tags: ['webgpu', 'tsl', 'shaders', 'particles'],
        seoDescription: 'Mesh shatters into thousands of GPU particles on interaction. WebGPU TSL destruction effect.',
    },
    {
        name: 'Dissolve',
        slug: 'dissolve',
        tags: ['webgpu', 'tsl', 'shaders', 'particles'],
        seoDescription: 'Dissolve transition on a particle mesh using custom TSL shaders. WebGPU Three.js lab demo.',
    },
    {
        name: 'Particles black hole',
        slug: 'particles-black-hole',
        tags: ['webgl', 'particles', 'shaders'],
        seoDescription: 'Particles spiral into a gravitational black hole. Classic WebGL GLSL particle simulation.',
    },
    {
        name: 'Snowflakes',
        slug: 'snowflakes',
        tags: ['webgl', 'particles', 'shaders'],
        seoDescription: 'Falling procedural snowflakes in a winter particle scene. WebGL shader experiment.',
    },
    {
        name: 'Attraction and collisions',
        slug: 'attractor-collisions',
        tags: ['webgpu', 'tsl', 'shaders', 'compute'],
        seoTitle: 'Attractor and collisions',
        seoDescription:
            'Thousands of particles orbit an attractor with physics collisions. WebGPU compute shaders and TSL.',
    },
    {
        name: 'TSL custom node material',
        slug: 'tsl-custom-node-material',
        tags: ['webgpu', 'tsl', 'shaders'],
        seoDescription: 'Reusable TSL node material you can extend for custom WebGPU shading pipelines in Three.js.',
    },
    {
        name: 'Particles noised morphing',
        slug: 'particles-morphing-2',
        tags: ['webgpu', 'tsl', 'shaders', 'compute'],
        seoTitle: 'Particles morphing (WebGPU)',
        seoDescription: 'Click to morph GPU particles between 3D shapes. WebGPU compute shaders and TSL.',
        tip: 'Click',
    },
    {
        name: 'Magic wand',
        slug: 'magic-wand-cursor',
        tags: ['webgpu', 'tsl', 'shaders', 'compute'],
        seoTitle: 'Magic wand cursor',
        seoDescription: 'Sparkling magic wand trail follows the pointer. WebGPU compute particle cursor effect.',
    },
    {
        name: 'Flow field',
        slug: 'flow-field',
        tags: ['webgpu', 'tsl', 'shaders', 'compute'],
        seoDescription: 'Particles flow along a vector field simulation. WebGPU compute shaders with TSL.',
    },
    {
        name: 'Nightingale hover effect (recreated)',
        slug: 'nightingale-hover-effect-recreated',
        tags: ['webgpu', 'tsl', 'shaders'],
        seoTitle: 'Nightingale hover effect recreated',
        seoDescription: "Recreation of Nightingale's hover wave image reveal. WebGPU TSL shader effect.",
        tip: 'Click',
    },
    {
        name: 'Infinite water',
        slug: 'infinite-water',
        tags: ['webgpu', 'tsl', 'shaders'],
        seoDescription: 'Infinitely scrolling procedural water surface. Scroll to move; WebGPU TSL shaders.',
        tip: 'Scroll',
    },
    {
        name: 'Particles twist',
        slug: 'particles-twist',
        tags: ['webgpu', 'tsl', 'shaders', 'particles', 'compute'],
        seoTitle: 'Particles Twist',
        seoDescription: 'GPGPU particle cloud twisted by shader forces. WebGPU compute experiment.',
    },
    {
        name: 'Particles following cursor position',
        slug: 'particles-following-cursor-position',
        tags: ['webgl', 'shaders', 'particles'],
        seoDescription: 'FBO particle swarm tracks cursor position in 3D. WebGL framebuffer simulation.',
    },
    {
        name: 'Displaced sphere with extended three.js material',
        slug: 'displaced-sphere-csm',
        tags: ['webgl', 'shaders', 'displacement'],
        seoDescription: 'Vertex-displaced sphere with an extended Three.js custom shader material. WebGL demo.',
    },
    {
        name: 'Displaced sphere v2',
        slug: 'displaced-sphere-2',
        tags: ['webgl', 'shaders', 'displacement'],
        seoDescription: 'Second take on procedural sphere vertex displacement. WebGL GLSL shading experiment.',
    },
    {
        name: 'Particles photo mouse trail',
        slug: 'particles-photo-mouse-trail',
        tags: ['webgl', 'shaders', 'particles'],
        seoDescription: 'Mouse leaves a trail of photo-textured particles. WebGL shader experiment.',
    },
    {
        name: 'Particles model shape',
        slug: 'particles-model-shape',
        tags: ['webgl', 'shaders', 'particles'],
        seoDescription: 'Particles assemble into a 3D model silhouette. WebGL GLSL particle system.',
    },
    {
        name: 'FBO particles morphing',
        slug: 'fbo-particles-morphing',
        tags: ['webgl', 'shaders', 'particles'],
        seoDescription: 'GPU particles morph between targets via framebuffer objects. WebGL FBO technique.',
    },
    {
        name: 'FBO particles',
        slug: 'fbo-particles',
        tags: ['webgl', 'shaders', 'particles'],
        seoDescription: 'Particle simulation rendered through framebuffer objects. WebGL GPGPU basics.',
    },
    {
        name: 'GPU particles',
        slug: 'gpu-particles',
        tags: ['webgl', 'shaders', 'particles'],
        seoDescription: 'GPU-accelerated particle field with shader-driven motion. WebGL experiment.',
    },
    {
        name: 'Displaced sphere',
        slug: 'displaced-sphere',
        tags: ['webgl', 'shaders', 'displacement'],
        seoDescription: 'Procedural vertex displacement on a sphere mesh. WebGL custom shader material.',
    },
    {
        name: 'Distorted scroller',
        slug: 'distorted-scroller',
        tags: ['webgl', 'shaders', 'slider'],
        seoDescription: 'Scroll-driven UV distortion on image planes. WebGL slider shader experiment.',
    },
    {
        name: 'Image transition',
        slug: 'image-transition',
        tags: ['webgl', 'shaders', 'transition', 'displacement'],
        seoDescription: 'Ripple-wave shader transition between two images. WebGL displacement transition.',
    },
    {
        name: 'Vertex wave animation',
        slug: 'vertex-wave-animation',
        tags: ['webgl', 'shaders', 'displacement'],
        seoDescription: 'Animated sine waves displace mesh vertices in the vertex shader. WebGL demo.',
    },
    {
        name: 'Endless',
        slug: 'endless-1',
        tags: ['webgl', 'shaders'],
        seoDescription: 'Looping fractal feedback shader with endless color motion. WebGL fullscreen fragment shader.',
    },
    {
        name: 'Infinite UV animation',
        slug: 'sphere-infinite-uv',
        tags: ['webgl', 'shaders'],
        seoDescription: 'Infinite UV scroll mapped onto a sphere surface. WebGL texture animation shader.',
    },
    {
        name: 'Particles on model surface',
        slug: 'particles-on-model-surface',
        tags: ['webgl', 'particles'],
        seoDescription: 'GPU particles sampled and rendered on a 3D model surface. WebGL experiment.',
    },
    {
        name: 'Flower-ish',
        slug: 'flower-ish',
        tags: ['webgl', 'shaders', 'displacement'],
        seoDescription: 'Procedural flower-like torus via smooth modular vertex displacement. WebGL shaders.',
    },
    {
        name: 'Refraction & dispersion',
        slug: 'refraction-and-dispersion',
        tags: ['webgl', 'shaders', 'refraction'],
        seoDescription: 'Glass-like refraction with chromatic dispersion in a WebGL shader scene.',
    },
    {
        name: 'Animated blob',
        slug: 'animated-blob',
        tags: ['webgl', 'shaders'],
        seoDescription: 'Soft animated blob with smooth organic motion. WebGL vertex and fragment shaders.',
    },
    {
        name: 'Displaced torus',
        slug: 'displaced-torus',
        tags: ['webgl', 'shaders'],
        seoDescription: 'Noise-displaced torus knot with custom GLSL materials. WebGL shading experiment.',
    },
    {
        name: 'Plane wave',
        slug: 'plane-wave',
        tags: ['webgl', 'shaders'],
        seoDescription: 'Rippling wave animation across a plane mesh. WebGL vertex shader experiment.',
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
