/* eslint-disable import/no-anonymous-default-export */
import React from 'react';
import Button from './Button';

export default {
    component: Button,
    title: 'Components/Button/Playground',
    parameters: {
        chromatic: { disableSnapshot: true },
    },
};

const Template = ({ text, ...args }) => <Button {...args}>{text}</Button>;

export const Playground = Template.bind({});
Playground.args = {
    text: 'Button',
    geometryVariant: 'default',
    variant: 'primary',
};
