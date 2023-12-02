import { Metadata } from 'next';
import Experience from './experience';

export const metadata: Metadata = {
    title: 'Marquee',
    description: 'WebGL marquee animation.',
};

const MarqueeExperimentPage = () => {
    return <Experience />;
};

export default MarqueeExperimentPage;
