import { Metadata } from 'next';
import ExperimentLayout from '../../ExperimentLayout';
import Experience from './experience';

export const metadata: Metadata = {
    title: 'Particles twist (WebGPU)',
    description: 'WebGPU particles twist animation using shaders',
};

const ExperimentPage = () => {
    return (
        <ExperimentLayout
            sourceLink="https://github.com/pavel-mazhuga/portfolio/tree/main/src/app/lab/particles-twist/webgpu"
            webglVersion="/lab/particles-twist"
        >
            <div className="canvas-wrapper">
                <Experience />
            </div>
        </ExperimentLayout>
    );
};

export default ExperimentPage;
