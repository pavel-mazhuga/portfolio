/** Experiments with a dedicated `pages/lab/<slug>.astro` (not `[slug].astro`). */
export const labExperimentCustomSlugs = ['liquid-glass'] as const;

export type LabExperimentCustomSlug = (typeof labExperimentCustomSlugs)[number];

export function isLabExperimentCustomSlug(slug: string): slug is LabExperimentCustomSlug {
    return (labExperimentCustomSlugs as readonly string[]).includes(slug);
}
