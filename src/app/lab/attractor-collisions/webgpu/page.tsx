import { Metadata } from 'next';
import ExperimentLayout from '../../ExperimentLayout';
import Experience from './experience';

export const metadata: Metadata = {
    title: 'Attractor and collisions (WebGPU)',
    description: 'WebGPU Attractor and collisions using TSL',
};

const ExperimentPage = () => {
    return (
        <ExperimentLayout sourceLink="https://github.com/pavel-mazhuga/portfolio/tree/main/src/app/lab/attractor-collisions/webgpu">
            <div className="canvas-wrapper overscroll-behavior-none">
                <Experience />
            </div>
        </ExperimentLayout>
    );
};

export default ExperimentPage;
