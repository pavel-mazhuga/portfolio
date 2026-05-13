const enabled = false;

export const CDN_DOMAIN = 'https://cdn.pavelmazhuga.com';

export const fromCDN = (path: string) =>
    enabled && process.env.NODE_ENV === 'production' && process.env.ENV === 'production' && !path.startsWith(CDN_DOMAIN)
        ? CDN_DOMAIN + path
        : path;
