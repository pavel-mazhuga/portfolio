import { Metadata } from 'next';
import Experience from './experience';

export const metadata: Metadata = {
    title: 'Noise displaced sphere with custom three.js material',
    description: 'WebGL displaced sphere with custom three.js material',
};

const ExperimentPage = () => {
    return <Experience />;
};

export default ExperimentPage;
