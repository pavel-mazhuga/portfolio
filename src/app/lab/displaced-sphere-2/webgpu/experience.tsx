'use client';

import dynamic from 'next/dynamic';
import ExperimentLayout from '../../ExperimentLayout';
import LevaWrapper from '../../LevaWrapper';

const Demo = dynamic(() => import('./Demo'), { ssr: false });

const Experience = () => {
    return (
        <ExperimentLayout sourceLink="https://github.com/pavel-mazhuga/portfolio/tree/main/src/app/lab/displaced-sphere-2/webgpu">
            <div className="canvas-wrapper">
                <LevaWrapper />
                <Demo />
            </div>
        </ExperimentLayout>
    );
};

export default Experience;
