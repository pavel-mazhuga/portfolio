import { Metadata } from 'next';
import Experience from './experience';

export const metadata: Metadata = {
    title: 'Distorted Scroller Slider',
    description: 'Distorted Scroller Slider animation using shaders',
};

const DistortedScrollerExperimentPage = () => {
    return <Experience />;
};

export default DistortedScrollerExperimentPage;
