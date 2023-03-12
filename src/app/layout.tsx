import '../css/app.scss';
import type { Metadata } from 'next';
import Providers from '@/components/layout/Providers';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import LayoutGrid from '@/components/utils/LayoutGrid';
import Html from './Html';
import Cursor from '@/components/layout/Cursor';
import WebGL from '@/components/layout/WebGL';

const WEBSITE_NAME = 'Next.js boilerplate';
const WEBSITE_DESCRIPTION = '[DESCRIPTION]';
const WEBSITE_OG_IMAGE = '/img/og-image.jpg';

export const metadata: Metadata = {
    title: {
        default: WEBSITE_NAME,
        template: `%s - ${WEBSITE_NAME}`,
    },
    description: WEBSITE_DESCRIPTION,
    viewport: {
        width: 'device-width',
        initialScale: 1,
        maximumScale: 1,
    },
    icons: {
        icon: '/img/favicon/favicon.ico',
        // apple: '/apple-touch-icon.png',
    },
    openGraph: {
        title: WEBSITE_NAME,
        description: WEBSITE_DESCRIPTION,
        siteName: WEBSITE_NAME,
        images: [
            {
                url: WEBSITE_OG_IMAGE,
                width: 1200,
                height: 628,
            },
        ],
        type: 'website',
    },
    twitter: {
        card: 'summary',
        title: WEBSITE_NAME,
        description: WEBSITE_DESCRIPTION,
        images: [WEBSITE_OG_IMAGE],
    },
    // manifest: '/img/favicon/site.webmanifest',
};

function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <Providers>
            <Html>
                <body>
                    <WebGL />
                    <Header />
                    <main className="main">{children}</main>
                    <Footer />
                    <div id="modal-root"></div>
                    <Cursor />
                    {process.env.NODE_ENV === 'development' && <LayoutGrid />}
                </body>
            </Html>
        </Providers>
    );
}

export default RootLayout;
