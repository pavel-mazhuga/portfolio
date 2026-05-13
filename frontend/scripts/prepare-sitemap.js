import fs from 'fs';
import path from 'path';

try {
    // if SSG
    fs.renameSync(
        path.join(import.meta.dirname, '../build/sitemap-index.xml'),
        path.join(import.meta.dirname, '../build/sitemap.xml'),
    );
} catch {
    // if SSR
    fs.renameSync(
        path.join(import.meta.dirname, '../build/client/sitemap-index.xml'),
        path.join(import.meta.dirname, '../build/client/sitemap.xml'),
    );
}
