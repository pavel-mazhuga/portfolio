import { Metadata } from 'next';
import Experience from './experience';

export const metadata: Metadata = {
    title: 'Particles following cursor position',
    description: 'Particles animated on GPU using FBO technique following cursor position',
};

const ExperimentPage = () => {
    return <Experience />;
};

export default ExperimentPage;
