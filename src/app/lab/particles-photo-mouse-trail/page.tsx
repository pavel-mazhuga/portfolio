import { Metadata } from 'next';
import Experience from './experience';

export const metadata: Metadata = {
    title: 'Particles photo mouse trail effect',
    description: 'Particles photo mouse trail effect',
};

const ExperimentPage = () => {
    return <Experience />;
};

export default ExperimentPage;
