import { Metadata } from 'next';
import Experience from './experience';

export const metadata: Metadata = {
    title: 'Flower-ish',
    description: 'WebGL flower-link shape demo',
};

const FlowerishExperimentPage = () => {
    return <Experience />;
};

export default FlowerishExperimentPage;
