import { Metadata } from 'next';
import ExperimentLayout from '../../ExperimentLayout';
import Experience from './experience';

export const metadata: Metadata = {
    title: 'Flow Field (WebGPU)',
    description: 'WebGPU Flow Field using TSL',
};

const ExperimentPage = () => {
    return (
        <ExperimentLayout sourceLink="https://github.com/pavel-mazhuga/portfolio/tree/main/src/app/lab/flow-field/webgpu">
            <div className="canvas-wrapper">
                <Experience />
            </div>
        </ExperimentLayout>
    );
};

export default ExperimentPage;
