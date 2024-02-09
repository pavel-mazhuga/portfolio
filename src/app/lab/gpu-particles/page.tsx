import { Metadata } from 'next';
import Experience from './experience';

export const metadata: Metadata = {
    title: 'GPU particles',
    description: 'Particles animated on GPU',
};

const ExperimentPage = () => {
    return <Experience />;
};

export default ExperimentPage;
