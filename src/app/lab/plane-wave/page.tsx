import { Metadata } from 'next';
import Experience from './experience';

export const metadata: Metadata = {
    title: 'Plane wave',
    description: 'WebGL wave animation. Vertex displacement.',
};

const PlaneWaveExperimentPage = () => {
    return <Experience />;
};

export default PlaneWaveExperimentPage;
