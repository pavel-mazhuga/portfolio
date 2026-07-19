import type { APIRoute } from 'astro';
import { buildManifest } from '@/shared/config/website-metadata';

export const prerender = true;

export const GET: APIRoute = () =>
    new Response(JSON.stringify(buildManifest()), {
        headers: { 'Content-Type': 'application/manifest+json' },
    });
