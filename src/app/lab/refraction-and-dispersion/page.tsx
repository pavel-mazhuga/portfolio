import { Metadata } from 'next';
import Experience from './experience';

export const metadata: Metadata = {
    title: 'Refraction & dispersion',
    description: 'WebGL refraction & dispersion demo',
};

const RefractionBubblesExperimentPage = () => {
    return <Experience />;
};

export default RefractionBubblesExperimentPage;
