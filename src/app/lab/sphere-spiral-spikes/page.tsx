import { Metadata } from 'next';
import ExperimentLayout from '../ExperimentLayout';
import Experience from './experience';

export const metadata: Metadata = { title: 'Sphere Spiral Spikes', description: 'Sphere Spiral Spikes using TSL' };

const ExperimentPage = () => {
    return (
        <ExperimentLayout sourceLink="https://github.com/pavel-mazhuga/portfolio/tree/main/src/app/lab/sphere-spiral-spikes">
            <div className="canvas-wrapper">
                <Experience />
            </div>
        </ExperimentLayout>
    );
};

export default ExperimentPage;
