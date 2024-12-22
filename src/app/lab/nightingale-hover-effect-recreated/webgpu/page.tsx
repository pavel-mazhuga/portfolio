import { Metadata } from 'next';
import ExperimentLayout from '../../ExperimentLayout';
import Experience from './experience';

export const metadata: Metadata = {
    title: 'Nightingale hover effect (WebGPU)',
    description: 'WebGPU Nightingale hover effect using TSL',
};

const ExperimentPage = () => {
    return (
        <ExperimentLayout sourceLink="https://github.com/pavel-mazhuga/portfolio/tree/main/src/app/lab/nightingale-hover-effect-recreated/webgpu">
            <div className="canvas-wrapper">
                <Experience />
            </div>
        </ExperimentLayout>
    );
};

export default ExperimentPage;
