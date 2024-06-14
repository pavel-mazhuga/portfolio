import { Metadata } from 'next';
import Experience from './experience';

export const metadata: Metadata = {
    title: 'Particles twist',
    description: 'WebGL particles twist animation using shaders',
};

const ExperimentPage = () => {
    return <Experience />;
};

export default ExperimentPage;
