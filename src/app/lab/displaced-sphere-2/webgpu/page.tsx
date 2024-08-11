import { Metadata } from 'next';
import Experience from './experience';

export const metadata: Metadata = {
    title: 'WebGPU Noise displaced sphere',
    description: 'WebGPU displaced sphere using cnoise and some lighting',
};

const ExperimentPage = () => {
    return <Experience />;
};

export default ExperimentPage;
