import '../css/app.scss';
import type { Metadata } from 'next';
import Providers from '@/components/layout/Providers';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import LayoutGrid from '@/components/utils/LayoutGrid';
import Html from './Html';
import HideInterface from './HideInterface';
import Metrics from './Metrics';

const WEBSITE_NAME = 'Pavel Mazhuga — creative frontend developer';
const WEBSITE_DESCRIPTION =
    'Creative frontend developer. Passionate about WebGL and related stuff, stunning motion and animations.';
const WEBSITE_OG_IMAGE = '/img/og-image.jpg';

export const metadata: Metadata = {
    title: {
        default: WEBSITE_NAME,
        template: `%s — ${WEBSITE_NAME}`,
    },
    description: WEBSITE_DESCRIPTION,
    viewport: {
        width: 'device-width',
        initialScale: 1,
    },
    icons: {
        icon: '/favicon.png',
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
};

function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <Providers>
            <Html>
                {process.env.NODE_ENV === 'production' && <Metrics />}
                <body>
                    <Header />
                    <main className="main">{children}</main>
                    <Footer />
                    {process.env.NODE_ENV === 'development' && (
                        <>
                            <LayoutGrid />
                            <HideInterface />
                        </>
                    )}
                </body>
            </Html>
        </Providers>
    );
}

export default RootLayout;
