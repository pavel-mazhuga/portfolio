import { Metadata } from 'next';
import ExperimentLayout from '../ExperimentLayout';
import Experience from './experience';

export const metadata: Metadata = {
    title: 'Three.js Custom Node Material',
    description: 'Custom Node Material using TSL',
};

const ExperimentPage = () => {
    return (
        <ExperimentLayout sourceLink="https://github.com/pavel-mazhuga/portfolio/tree/main/src/app/lab/tsl-custom-node-material">
            <div className="canvas-wrapper">
                <Experience />
            </div>
        </ExperimentLayout>
    );
};

export default ExperimentPage;
