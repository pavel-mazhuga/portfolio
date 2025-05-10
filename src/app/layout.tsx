import type { Metadata, Viewport } from 'next';
import Footer from '@/app/components/layout/Footer';
import Header from '@/app/components/layout/Header';
import Providers from '@/app/components/layout/Providers';
import '../css/app.scss';
import HideInterface from './HideInterface';
import Html from './Html';
import Metrics from './Metrics';

const WEBSITE_NAME = 'Pavel Mazhuga — creative frontend developer';
const WEBSITE_DESCRIPTION =
    'Creative frontend developer. Passionate about WebGL and related stuff, stunning motion and animations.';
const WEBSITE_OG_IMAGE = '/img/og-image.jpg';

export const metadata: Metadata = {
    title: { default: WEBSITE_NAME, template: `%s — ${WEBSITE_NAME}` },
    description: WEBSITE_DESCRIPTION,
    icons: {
        icon: '/favicon.png',
        // apple: '/apple-touch-icon.png',
    },
    openGraph: {
        title: WEBSITE_NAME,
        description: WEBSITE_DESCRIPTION,
        siteName: WEBSITE_NAME,
        images: [{ url: WEBSITE_OG_IMAGE, width: 1200, height: 628 }],
        type: 'website',
    },
    twitter: { card: 'summary', title: WEBSITE_NAME, description: WEBSITE_DESCRIPTION, images: [WEBSITE_OG_IMAGE] },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <Providers>
            <Html>
                {process.env.NODE_ENV === 'production' && <Metrics />}
                <body>
                    <Header />
                    <main className="main">{children}</main>
                    <Footer />
                    {/* {process.env.NODE_ENV === 'development' && ( */}
                    <>
                        <HideInterface />
                    </>
                    {/* )} */}
                </body>
            </Html>
        </Providers>
    );
}

export default RootLayout;
