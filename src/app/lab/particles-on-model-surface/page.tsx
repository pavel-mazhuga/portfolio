import { Metadata } from 'next';
import Experience from './experience';

export const metadata: Metadata = {
    title: 'Particles on model surface',
    description: 'WebGL demo showing usage of MeshSurfaceSampler. Distributed particles along the mesh surface.',
};

const ParticlesOnModelSufraceExperimentPage = () => {
    return <Experience />;
};

export default ParticlesOnModelSufraceExperimentPage;
