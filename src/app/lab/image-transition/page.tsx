import { Metadata } from 'next';
import Experience from './experience';

export const metadata: Metadata = {
    title: 'Image transition',
    description: 'WebGL image transition.',
};

const ImageTransitionExperimentPage = () => {
    return <Experience />;
};

export default ImageTransitionExperimentPage;
