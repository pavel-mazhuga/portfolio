import { Metadata } from 'next';
import Experience from './experience';

export const metadata: Metadata = {
    title: 'Vertex wave animation',
    description: 'WebGL vertex wave animation.',
};

const PlaneVertexWaveExperimentPage = () => {
    return <Experience />;
};

export default PlaneVertexWaveExperimentPage;
