import type { Role, VideoShape } from '@/shared/model/types';

export type IProject = {
    slug: string;
    title: string;
    description: string;
    video: VideoShape;
    websiteUrl: string;
    releaseYear: number;
    role: Role;
    collaborators: string[];
    technologies: string[];
    recognitions: { name: string; url?: string }[];
};
