'use client';

import dynamic from 'next/dynamic';
import ExperimentLayout from '../../ExperimentLayout';
import LevaWrapper from '../../LevaWrapper';

const Demo = dynamic(() => import('./Demo'), { ssr: false });

const Experience = () => {
    return (
        <ExperimentLayout
            sourceLink="https://github.com/pavel-mazhuga/portfolio/tree/main/src/app/lab/fbo-particles/webgpu"
            webglVersion="/lab/fbo-particles"
        >
            <LevaWrapper />
            <div className="canvas-wrapper">
                <Demo />
            </div>
        </ExperimentLayout>
    );
};

export default Experience;
