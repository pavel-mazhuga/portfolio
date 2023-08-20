import { Metadata } from 'next';
import Experience from './experience';

export const metadata: Metadata = {
    title: 'Spiral',
    description: 'WebGL spiral demo',
};

const SpiralExperimentPage = () => {
    return <Experience />;
};

export default SpiralExperimentPage;
