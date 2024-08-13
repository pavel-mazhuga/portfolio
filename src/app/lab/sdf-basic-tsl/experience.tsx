'use client';

import dynamic from 'next/dynamic';
import ExperimentLayout from '../ExperimentLayout';

const Experiment = dynamic(() => import('./Experiment'), { ssr: false });

const Experience = () => {
    return (
        <ExperimentLayout sourceLink="todo">
            <div className="canvas-wrapper">
                <Experiment />
            </div>
        </ExperimentLayout>
    );
};

export default Experience;
