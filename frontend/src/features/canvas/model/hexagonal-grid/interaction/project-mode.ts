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

export function buildProjectModeTimeline(active: boolean, ctx: ProjectModeContext): gsap.core.Timeline {
    const { uniforms, resumeProjectPlayback } = ctx;
    const timeline = gsap.timeline();

    if (active) {
        resumeProjectPlayback();

        timeline
            .to(uniforms.projectTransition, {
                value: 1,
                duration: 2.5,
                ease: 'power2.inOut',
            })
            .to(
                uniforms.videoTransition,
                {
                    value: 1,
                    duration: 1,
                    ease: 'power2.out',
                },
                '-=1',
            )
            .to(
                uniforms.bloomIntensity,
                {
                    value: 0.8,
                    duration: 1,
                    ease: 'power2.out',
                },
                '-=1',
            );
    } else {
        timeline
            .to(
                uniforms.videoTransition,
                {
                    value: 0,
                    duration: 0.5,
                    ease: 'power2.out',
                },
                0,
            )
            .to(
                uniforms.bloomIntensity,
                {
                    value: 1.5,
                    duration: 0.5,
                    ease: 'power2.out',
                },
                0,
            )
            .to(
                uniforms.projectTransition,
                {
                    value: 0,
                    duration: 2,
                    ease: 'power2.inOut',
                },
                0,
            );
    }

    return timeline;
}
