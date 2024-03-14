import { Metadata } from 'next';
import Experience from './experience';

export const metadata: Metadata = {
    title: 'Particles model shape',
    description: 'A model shape made of particles using FBO technique',
};

const ExperimentPage = () => {
    return <Experience />;
};

export default ExperimentPage;
