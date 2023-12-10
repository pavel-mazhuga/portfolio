import { Metadata } from 'next';
import Experience from './experience';

export const metadata: Metadata = {
    title: 'WebGPU Particles',
    description: 'WebGPU particles.',
};

const WebgpuParticlesExperimentPage = () => {
    return <Experience />;
};

export default WebgpuParticlesExperimentPage;
