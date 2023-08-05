import { Metadata } from 'next';
import Experience from './experience';

export const metadata: Metadata = {
    title: 'Animated blob',
    description: 'WebGL blob.',
};

const DisplacedTorusExperimentPage = () => {
    return <Experience />;
};

export default DisplacedTorusExperimentPage;
