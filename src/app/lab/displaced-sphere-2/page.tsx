import { Metadata } from 'next';
import Experience from './experience';

export const metadata: Metadata = {
    title: 'Noise displaced sphere',
    description: 'WebGL displaced sphere using cnoise and some lighting',
};

const ExperimentPage = () => {
    return <Experience />;
};

export default ExperimentPage;
