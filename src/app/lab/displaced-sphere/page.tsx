import { Metadata } from 'next';
import Experience from './experience';

export const metadata: Metadata = {
    title: 'Displaced sphere',
    description: 'Displaced sphere',
};

const DisplacedSphereExperimentPage = () => {
    return <Experience />;
};

export default DisplacedSphereExperimentPage;
