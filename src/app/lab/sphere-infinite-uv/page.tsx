import { Metadata } from 'next';
import Experience from './experience';

export const metadata: Metadata = {
    title: 'Infinite UV',
    description: 'WebGL uv animation.',
};

const SphereInfiniteUvExperimentPage = () => {
    return <Experience />;
};

export default SphereInfiniteUvExperimentPage;
