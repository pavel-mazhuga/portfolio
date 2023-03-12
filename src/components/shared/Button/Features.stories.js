/* eslint-disable import/no-anonymous-default-export */
import React from 'react';
import Button from './Button';

export default {
    component: Button,
    title: 'Components/Button/Features',
};

const Template = ({ text = 'Button', ...args }) => <Button {...args}>{text}</Button>;

export const Default = Template.bind({});
Default.args = {};

export const Primary = Template.bind({});
Primary.args = { variant: 'primary' };

export const Wide = Template.bind({});
Wide.args = { ...Primary.args, geometryVariant: 'wide' };
