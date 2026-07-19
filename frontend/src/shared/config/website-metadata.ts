type WebAppManifestIcon = {
    src: string;
    sizes: string;
    type: 'image/png';
    purpose: 'any' | 'maskable';
};

type WebAppManifest = {
    name: string;
    short_name: string;
    start_url: string;
    display: typeof WEBSITE_METADATA.display;
    background_color: string;
    theme_color: string;
    icons: WebAppManifestIcon[];
};

export const WEBSITE_METADATA = {
    name: 'Pavel Mazhuga | Creative Frontend Developer',
    shortName: 'Pavel Mazhuga',
    startUrl: '/?utm_source=pwa',
    display: 'standalone' as const,
    themeColor: '#000000',
    backgroundColor: '#000000',
    icons: {
        any192: '/static/img/icon-192.png',
        any512: '/static/img/icon-512.png',
        maskable512: '/static/img/icon-maskable-512.png',
        appleTouch: '/static/img/apple-touch-icon.png',
    },
} as const;

export const buildManifest = (): WebAppManifest => ({
    name: WEBSITE_METADATA.name,
    short_name: WEBSITE_METADATA.shortName,
    start_url: WEBSITE_METADATA.startUrl,
    display: WEBSITE_METADATA.display,
    background_color: WEBSITE_METADATA.backgroundColor,
    theme_color: WEBSITE_METADATA.themeColor,
    icons: [
        { src: WEBSITE_METADATA.icons.any192, sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: WEBSITE_METADATA.icons.any512, sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: WEBSITE_METADATA.icons.maskable512, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
});
