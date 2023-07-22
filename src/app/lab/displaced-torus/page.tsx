import { Metadata } from 'next';
import Experience from './experience';

export const metadata: Metadata = {
    title: 'Displaced torus',
    description: 'Displaced torus. Vertex displacement animation.',
};

const DisplacedTorusExperimentPage = () => {
    return <Experience />;
};

export default DisplacedTorusExperimentPage;
