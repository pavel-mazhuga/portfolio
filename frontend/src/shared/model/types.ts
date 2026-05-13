export type PageMeta = Partial<{
    title: string;
    description: string;
    ogImage: string;
}>;

export type AppBreadcrumbs = {
    text: string;
    href?: string | null;
}[];

export type CommonPageProps = {
    bodyClass?: string;
    meta: PageMeta &
        Partial<{
            baseTitle: string;
        }>;
    breadcrumbs: AppBreadcrumbs;
};

export type ImageShape = {
    src: string;
    width?: number;
    height?: number;
    alt?: string;
    title?: string;
};

export type VideoShape = {
    media?: string;
    src: string;
    type: string;
}[];

export enum Role {
    FRONTEND = 'frontend',
}
