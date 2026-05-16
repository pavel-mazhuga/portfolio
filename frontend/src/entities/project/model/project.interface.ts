import type { Role, VideoShape } from '@/shared/model/types';

export type IProject = {
    slug: string;
    title: string;
    description: string;
    video: VideoShape;
    websiteUrl: string;
    releaseYear: number;
    role: Role;
    collaborators: {
        name: string;
        url?: string;
    }[];
    technologies: string[];
    recognitions: { name: string; url?: string }[];
};
