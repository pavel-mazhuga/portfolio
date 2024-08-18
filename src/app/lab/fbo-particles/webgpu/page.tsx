import { Metadata } from 'next';
import Experience from './experience';

export const metadata: Metadata = {
    title: 'WebGPU particles',
    description: 'Particles animated on GPU using compute shaders',
};

const ExperimentPage = () => {
    return <Experience />;
};

export default ExperimentPage;
