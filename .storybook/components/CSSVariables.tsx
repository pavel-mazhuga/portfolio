import React, { ReactNode } from 'react';
import { ArgsTable } from '@storybook/addon-docs';

type Props = {
    children: ReactNode;
    component: ReactNode;
    data: { name: string; description?: string; default?: string }[];
};

const CSSVariables = ({ children, component, data = [] }: Props) => {
    return (
        <div className="storybook-block">
            <h2>CSS Variables</h2>
            {children}
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Default</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((obj, i) => (
                        <tr key={i}>
                            <td>{obj.name}</td>
                            <td>{obj.description || '-'}</td>
                            <td>{obj.default ? <span className="value-shield">{obj.default}</span> : '-'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default CSSVariables;
