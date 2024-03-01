import { Metadata } from 'next';
import Experience from './experience';

export const metadata: Metadata = {
    title: 'FBO particles morphing',
    description: 'Morphing particles using FBO technique',
};

const ExperimentPage = () => {
    return <Experience />;
};

export default ExperimentPage;
