import { Metadata } from 'next';
import ExperimentLayout from '../ExperimentLayout';
import Experience from './experience';

export const metadata: Metadata = { title: 'Grass Sphere', description: 'Grass Sphere using TSL' };

const ExperimentPage = () => {
    return (
        <ExperimentLayout sourceLink="https://github.com/pavel-mazhuga/portfolio/tree/main/src/app/lab/grass-sphere">
            <div className="canvas-wrapper">
                <Experience />
            </div>
        </ExperimentLayout>
    );
};

export default ExperimentPage;
