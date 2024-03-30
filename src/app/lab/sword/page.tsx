import { Metadata } from 'next';
import Experience from './experience';

export const metadata: Metadata = {
    title: 'Sword',
    description: 'Sword model with particles and postprocessing effects',
};

const ExperimentPage = () => {
    return <Experience />;
};

export default ExperimentPage;
