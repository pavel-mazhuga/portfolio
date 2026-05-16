import type { IProject } from '@/entities/project/model/project.interface';
import { Role } from '@/shared/model/types';

enum Recognition {
    FWA_OF_THE_DAY = 'FWA Of The Day',
    AWWARDS_WEBSITE_OF_THE_DAY = 'Awwwards Website Of The Day',
    CSSDA_WEBSITE_OF_THE_DAY = 'CSSDA Website Of The Day',
}

const CHIPSA = {
    name: 'Chipsa',
    url: 'https://chipsa.design',
} as const;

export const projects: IProject[] = [
    {
        slug: 'chillbase',
        title: 'Chillbase',
        description: '',
        video: [
            {
                src: '/static/videos/chillbase_9x16_1024x_opt.hevc.mp4',
                type: 'video/mp4;codecs="hvc1"',
                media: '(max-width: 1024px) and (orientation: portrait)',
            },
            {
                src: '/static/videos/chillbase_9x16_1024x_opt.mp4',
                type: 'video/mp4',
                media: '(max-width: 1024px) and (orientation: portrait)',
            },
            {
                src: '/static/videos/chillbase_16x9_1024x_opt.hevc.mp4',
                type: 'video/mp4;codecs="hvc1"',
                media: '(max-width: 1024px)',
            },
            {
                src: '/static/videos/chillbase_16x9_1024x_opt.mp4',
                type: 'video/mp4',
                media: '(max-width: 1024px)',
            },
            {
                src: '/static/videos/chillbase_9x16_opt.hevc.mp4',
                type: 'video/mp4;codecs="hvc1"',
                media: '(orientation: portrait)',
            },
            {
                src: '/static/videos/chillbase_9x16_opt.mp4',
                type: 'video/mp4',
                media: '(orientation: portrait)',
            },
            {
                src: '/static/videos/chillbase_16x9_opt.hevc.mp4',
                type: 'video/mp4;codecs="hvc1"',
            },
            {
                src: '/static/videos/chillbase_16x9_opt.mp4',
                type: 'video/mp4',
            },
        ],
        websiteUrl: 'https://chillbase.net/',
        releaseYear: 2025,
        role: Role.FRONTEND,
        collaborators: [CHIPSA],
        technologies: ['React (Next.js)', 'WebGL (Three.js)', 'Framer Motion'],
        recognitions: [
            {
                name: Recognition.CSSDA_WEBSITE_OF_THE_DAY,
                url: 'https://www.cssdesignawards.com/sites/chillbase/48418/',
            },
        ],
    },
    {
        slug: 'timeless',
        title: 'Timeless',
        description: '',
        video: [
            {
                src: '/static/videos/timeless_9x16_1024x_opt.hevc.mp4',
                type: 'video/mp4;codecs="hvc1"',
                media: '(max-width: 1024px) and (orientation: portrait)',
            },
            {
                src: '/static/videos/timeless_9x16_1024x_opt.mp4',
                type: 'video/mp4',
                media: '(max-width: 1024px) and (orientation: portrait)',
            },
            {
                src: '/static/videos/timeless_16x9_1024x_opt.hevc.mp4',
                type: 'video/mp4;codecs="hvc1"',
                media: '(max-width: 1024px)',
            },
            {
                src: '/static/videos/timeless_16x9_1024x_opt.mp4',
                type: 'video/mp4',
                media: '(max-width: 1024px)',
            },
            {
                src: '/static/videos/timeless_9x16_opt.hevc.mp4',
                type: 'video/mp4;codecs="hvc1"',
                media: '(orientation: portrait)',
            },
            {
                src: '/static/videos/timeless_9x16_opt.mp4',
                type: 'video/mp4',
                media: '(orientation: portrait)',
            },
            {
                src: '/static/videos/timeless_16x9_opt.hevc.mp4',
                type: 'video/mp4;codecs="hvc1"',
            },
            {
                src: '/static/videos/timeless_16x9_opt.mp4',
                type: 'video/mp4',
            },
        ],
        websiteUrl: 'https://timeless.club/en',
        releaseYear: 2025,
        role: Role.FRONTEND,
        collaborators: [CHIPSA],
        technologies: ['React (Next.js)', 'WebGL (Three.js)', 'Framer Motion'],
        recognitions: [],
    },
    {
        slug: 'samokat-museum',
        title: 'Samokat Courier Museum',
        description: '',
        video: [
            {
                src: '/static/videos/samokat_9x16_1024x_opt.hevc.mp4',
                type: 'video/mp4;codecs="hvc1"',
                media: '(max-width: 1024px) and (orientation: portrait)',
            },
            {
                src: '/static/videos/samokat_9x16_1024x_opt.mp4',
                type: 'video/mp4',
                media: '(max-width: 1024px) and (orientation: portrait)',
            },
            {
                src: '/static/videos/samokat_16x9_1024x_opt.hevc.mp4',
                type: 'video/mp4;codecs="hvc1"',
                media: '(max-width: 1024px)',
            },
            {
                src: '/static/videos/samokat_16x9_1024x_opt.mp4',
                type: 'video/mp4',
                media: '(max-width: 1024px)',
            },
            {
                src: '/static/videos/samokat_9x16_opt.hevc.mp4',
                type: 'video/mp4;codecs="hvc1"',
                media: '(orientation: portrait)',
            },
            {
                src: '/static/videos/samokat_9x16_opt.mp4',
                type: 'video/mp4',
                media: '(orientation: portrait)',
            },
            {
                src: '/static/videos/samokat_16x9_opt.hevc.mp4',
                type: 'video/mp4;codecs="hvc1"',
            },
            {
                src: '/static/videos/samokat_16x9_opt.mp4',
                type: 'video/mp4',
            },
        ],
        websiteUrl: 'https://museum.samokat.ru',
        releaseYear: 2023,
        role: Role.FRONTEND,
        collaborators: [CHIPSA],
        technologies: ['React (Next.js)', 'WebGL (Three.js)', 'Framer Motion'],
        recognitions: [],
    },
    {
        slug: 'chipsa',
        title: 'Chipsa',
        description: '',
        video: [
            {
                src: '/static/videos/chipsa_9x16_1024x_opt.hevc.mp4',
                type: 'video/mp4;codecs="hvc1"',
                media: '(max-width: 1024px) and (orientation: portrait)',
            },
            {
                src: '/static/videos/chipsa_9x16_1024x_opt.mp4',
                type: 'video/mp4',
                media: '(max-width: 1024px) and (orientation: portrait)',
            },
            {
                src: '/static/videos/chipsa_16x9_1024x_opt.hevc.mp4',
                type: 'video/mp4;codecs="hvc1"',
                media: '(max-width: 1024px)',
            },
            {
                src: '/static/videos/chipsa_16x9_1024x_opt.mp4',
                type: 'video/mp4',
                media: '(max-width: 1024px)',
            },
            {
                src: '/static/videos/chipsa_9x16_opt.hevc.mp4',
                type: 'video/mp4;codecs="hvc1"',
                media: '(orientation: portrait)',
            },
            {
                src: '/static/videos/chipsa_9x16_opt.mp4',
                type: 'video/mp4',
                media: '(orientation: portrait)',
            },
            {
                src: '/static/videos/chipsa_16x9_opt.hevc.mp4',
                type: 'video/mp4;codecs="hvc1"',
            },
            {
                src: '/static/videos/chipsa_16x9_opt.mp4',
                type: 'video/mp4',
            },
        ],
        websiteUrl: 'https://chipsa.design/',
        releaseYear: 2025,
        role: Role.FRONTEND,
        collaborators: [CHIPSA],
        technologies: ['React (Next.js)', 'WebGL (Three.js)', 'Framer Motion'],
        recognitions: [
            { name: Recognition.AWWARDS_WEBSITE_OF_THE_DAY, url: 'https://www.awwwards.com/sites/chipsa' },
            { name: Recognition.CSSDA_WEBSITE_OF_THE_DAY, url: 'https://www.cssdesignawards.com/sites/chipsa/47919/' },
        ],
    },
    {
        slug: 'zagranitsa',
        title: 'Zagranitsa',
        description: '',
        video: [
            {
                src: '/static/videos/zagranitsa_9x16_1024x_opt.hevc.mp4',
                type: 'video/mp4;codecs="hvc1"',
                media: '(max-width: 1024px) and (orientation: portrait)',
            },
            {
                src: '/static/videos/zagranitsa_9x16_1024x_opt.mp4',
                type: 'video/mp4',
                media: '(max-width: 1024px) and (orientation: portrait)',
            },
            {
                src: '/static/videos/zagranitsa_9x16_1024x_opt.hevc.mp4',
                type: 'video/mp4;codecs="hvc1"',
                media: '(max-width: 1024px)',
            },
            {
                src: '/static/videos/zagranitsa_9x16_1024x_opt.mp4',
                type: 'video/mp4',
                media: '(max-width: 1024px)',
            },
            {
                src: '/static/videos/zagranitsa_9x16_opt.hevc.mp4',
                type: 'video/mp4;codecs="hvc1"',
                media: '(orientation: portrait)',
            },
            {
                src: '/static/videos/zagranitsa_9x16_opt.mp4',
                type: 'video/mp4',
                media: '(orientation: portrait)',
            },
            {
                src: '/static/videos/zagranitsa_9x16_opt.hevc.mp4',
                type: 'video/mp4;codecs="hvc1"',
            },
            {
                src: '/static/videos/zagranitsa_9x16_opt.mp4',
                type: 'video/mp4',
            },
        ],
        websiteUrl: 'https://zagranitsa.pro/',
        releaseYear: 2023,
        role: Role.FRONTEND,
        collaborators: [CHIPSA],
        technologies: ['React (Next.js)', 'WebGL (Three.js)', 'Framer Motion'],
        recognitions: [],
    },
    {
        slug: 'control',
        title: 'Control',
        description: '',
        video: [
            {
                src: '/static/videos/control_9x16_1024x_opt.hevc.mp4',
                type: 'video/mp4;codecs="hvc1"',
                media: '(max-width: 1024px) and (orientation: portrait)',
            },
            {
                src: '/static/videos/control_9x16_1024x_opt.mp4',
                type: 'video/mp4',
                media: '(max-width: 1024px) and (orientation: portrait)',
            },
            {
                src: '/static/videos/control_16x9_1024x_opt.hevc.mp4',
                type: 'video/mp4;codecs="hvc1"',
                media: '(max-width: 1024px)',
            },
            {
                src: '/static/videos/control_16x9_1024x_opt.mp4',
                type: 'video/mp4',
                media: '(max-width: 1024px)',
            },
            {
                src: '/static/videos/control_9x16_opt.hevc.mp4',
                type: 'video/mp4;codecs="hvc1"',
                media: '(orientation: portrait)',
            },
            {
                src: '/static/videos/control_9x16_opt.mp4',
                type: 'video/mp4',
                media: '(orientation: portrait)',
            },
            {
                src: '/static/videos/control_16x9_opt.hevc.mp4',
                type: 'video/mp4;codecs="hvc1"',
            },
            {
                src: '/static/videos/control_16x9_opt.mp4',
                type: 'video/mp4',
            },
        ],
        websiteUrl: 'https://control.chipsa.ru/',
        releaseYear: 2021,
        role: Role.FRONTEND,
        collaborators: [CHIPSA],
        technologies: ['WebGL (OGL)', 'GSAP'],
        recognitions: [
            { name: Recognition.FWA_OF_THE_DAY, url: 'https://thefwa.com/cases/control-p2' },
            {
                name: Recognition.AWWARDS_WEBSITE_OF_THE_DAY,
                url: 'https://www.awwwards.com/sites/control',
            },
            { name: Recognition.CSSDA_WEBSITE_OF_THE_DAY, url: 'https://www.cssdesignawards.com/sites/control/39835/' },
        ],
    },
    {
        slug: 'chipsa-webgl3d',
        title: 'Chipsa WebGL Production',
        description: '',
        video: [
            {
                src: '/static/videos/chipsawebgl_9x16_1024x_opt.hevc.mp4',
                type: 'video/mp4;codecs="hvc1"',
                media: '(max-width: 1024px) and (orientation: portrait)',
            },
            {
                src: '/static/videos/chipsawebgl_9x16_1024x_opt.mp4',
                type: 'video/mp4',
                media: '(max-width: 1024px) and (orientation: portrait)',
            },
            {
                src: '/static/videos/chipsawebgl_16x9_1024x_opt.hevc.mp4',
                type: 'video/mp4;codecs="hvc1"',
                media: '(max-width: 1024px)',
            },
            {
                src: '/static/videos/chipsawebgl_16x9_1024x_opt.mp4',
                type: 'video/mp4',
                media: '(max-width: 1024px)',
            },
            {
                src: '/static/videos/chipsawebgl_9x16_opt.hevc.mp4',
                type: 'video/mp4;codecs="hvc1"',
                media: '(orientation: portrait)',
            },
            {
                src: '/static/videos/chipsawebgl_9x16_opt.mp4',
                type: 'video/mp4',
                media: '(orientation: portrait)',
            },
            {
                src: '/static/videos/chipsawebgl_16x9_opt.hevc.mp4',
                type: 'video/mp4;codecs="hvc1"',
            },
            {
                src: '/static/videos/chipsawebgl_16x9_opt.mp4',
                type: 'video/mp4',
            },
        ],
        websiteUrl: 'https://webgl3d.chipsa.design/',
        releaseYear: 2026,
        role: Role.FRONTEND,
        collaborators: [CHIPSA],
        technologies: ['Astro', 'WebGL (Three.js)', 'Rapier'],
        recognitions: [],
    },
];
