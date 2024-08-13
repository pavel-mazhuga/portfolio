import { Metadata } from 'next';
import Experience from './experience';

export const metadata: Metadata = {
    title: 'SDF with TSL',
    description: 'Basic SDF using WebGPU and Three.js Shading Language',
};

const ExperimentPage = () => {
    return <Experience />;
};

export default ExperimentPage;
