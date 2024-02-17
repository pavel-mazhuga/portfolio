import { Metadata } from 'next';
import Experience from './experience';

export const metadata: Metadata = {
    title: 'FBO particles',
    description: 'Particles animated on GPU using FBO technique',
};

const ExperimentPage = () => {
    return <Experience />;
};

export default ExperimentPage;
