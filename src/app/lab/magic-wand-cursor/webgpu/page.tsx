import { Metadata } from 'next';
import ExperimentLayout from '../../ExperimentLayout';
import Experience from './experience';

export const metadata: Metadata = {
    title: 'Magic wand cursor (WebGPU)',
    description: 'WebGPU Magic wand cursor using TSL',
};

const ExperimentPage = () => {
    return (
        <ExperimentLayout sourceLink="https://github.com/pavel-mazhuga/portfolio/tree/main/src/app/lab/magic-wand-cursor/webgpu">
            <div className="canvas-wrapper">
                <Experience />
            </div>
        </ExperimentLayout>
    );
};

export default ExperimentPage;
