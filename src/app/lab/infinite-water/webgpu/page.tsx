import { Metadata } from 'next';
import ExperimentLayout from '../../ExperimentLayout';
import Experience from './experience';

export const metadata: Metadata = {
    title: 'Infinite Water (WebGPU)',
    description: 'WebGPU Infinite Water using TSL',
};

const ExperimentPage = () => {
    return (
        <ExperimentLayout sourceLink="https://github.com/pavel-mazhuga/portfolio/tree/main/src/app/lab/infinite-water/webgpu">
            <div className="canvas-wrapper">
                <Experience />
            </div>
        </ExperimentLayout>
    );
};

export default ExperimentPage;
