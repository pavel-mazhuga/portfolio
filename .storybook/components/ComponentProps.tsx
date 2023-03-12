import React, { ReactNode } from 'react';
import { ArgsTable } from '@storybook/addon-docs';

const ComponentProps = ({ children, component }: { children: ReactNode; component: ReactNode }) => {
    return (
        <div className="storybook-block">
            <h2>Props</h2>
            {children}
            <ArgsTable of={component} />
        </div>
    );
};

export default ComponentProps;
