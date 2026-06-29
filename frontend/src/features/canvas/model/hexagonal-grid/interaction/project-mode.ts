import gsap from 'gsap';
import type { HexGridShaderUniforms } from '../types';

export type GridVideoPlayback = {
    playOnly: (index: number) => void;
    ensurePlaying: (index: number) => void;
    pauseAll: () => void;
};

export type ProjectModeContext = {
    uniforms: HexGridShaderUniforms;
    resumeProjectPlayback: () => void;
};

const ENTER_PROJECT_DURATION = 2.5;
const ENTER_VIDEO_DURATION = 1;
const ENTER_BLOOM_DURATION = 1;
const LEAVE_PROJECT_DURATION = 2;
const LEAVE_VIDEO_DURATION = 0.5;
const LEAVE_BLOOM_DURATION = 0.5;
const BLOOM_HOME = 1.5;
const BLOOM_PROJECTS = 0.8;
const MIN_MODE_DURATION = 0.08;

function durationForRange(full: number, from: number, to: number, rangeStart: number, rangeEnd: number): number {
    const headroom = Math.abs(to - from);
    const fullSpan = Math.abs(rangeEnd - rangeStart);

    if (fullSpan <= 0 || headroom <= 0) {
        return 0;
    }

    return Math.max(MIN_MODE_DURATION, full * (headroom / fullSpan));
}

export function buildProjectModeTimeline(active: boolean, ctx: ProjectModeContext): gsap.core.Timeline {
    const { uniforms, resumeProjectPlayback } = ctx;
    const timeline = gsap.timeline();

    if (active) {
        resumeProjectPlayback();

        const projectFrom = uniforms.projectTransition.value;
        const videoFrom = uniforms.videoTransition.value;
        const bloomFrom = uniforms.bloomIntensity.value;

        timeline
            .to(uniforms.projectTransition, {
                value: 1,
                duration: durationForRange(ENTER_PROJECT_DURATION, projectFrom, 1, 0, 1),
                ease: 'power2.inOut',
            })
            .to(
                uniforms.videoTransition,
                {
                    value: 1,
                    duration: durationForRange(ENTER_VIDEO_DURATION, videoFrom, 1, 0, 1),
                    ease: 'power2.out',
                },
                '-=1',
            )
            .to(
                uniforms.bloomIntensity,
                {
                    value: BLOOM_PROJECTS,
                    duration: durationForRange(ENTER_BLOOM_DURATION, bloomFrom, BLOOM_PROJECTS, BLOOM_HOME, BLOOM_PROJECTS),
                    ease: 'power2.out',
                },
                '-=1',
            );
    } else {
        const projectFrom = uniforms.projectTransition.value;
        const videoFrom = uniforms.videoTransition.value;
        const bloomFrom = uniforms.bloomIntensity.value;

        timeline
            .to(
                uniforms.videoTransition,
                {
                    value: 0,
                    duration: durationForRange(LEAVE_VIDEO_DURATION, videoFrom, 0, 1, 0),
                    ease: 'power2.out',
                },
                0,
            )
            .to(
                uniforms.bloomIntensity,
                {
                    value: BLOOM_HOME,
                    duration: durationForRange(LEAVE_BLOOM_DURATION, bloomFrom, BLOOM_HOME, BLOOM_PROJECTS, BLOOM_HOME),
                    ease: 'power2.out',
                },
                0,
            )
            .to(
                uniforms.projectTransition,
                {
                    value: 0,
                    duration: durationForRange(LEAVE_PROJECT_DURATION, projectFrom, 0, 1, 0),
                    ease: 'power2.inOut',
                },
                0,
            );
    }

    return timeline;
}
