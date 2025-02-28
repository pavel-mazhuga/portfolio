import { Metadata } from 'next';
import ExperimentLayout from '../../ExperimentLayout';
import Experience from './experience';

export const metadata: Metadata = {
    title: 'Particles morphing (WebGPU)',
    description: 'WebGPU particles morphing using TSL',
};

const ExperimentPage = () => {
    return (
        <ExperimentLayout sourceLink="https://github.com/pavel-mazhuga/portfolio/tree/main/src/app/lab/particles-morphing-2/webgpu">
            <div className="canvas-wrapper">
                <Experience />
            </div>
        </ExperimentLayout>
    );
};

export default ExperimentPage;
