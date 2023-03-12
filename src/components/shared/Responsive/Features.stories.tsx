import React from 'react';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import Responsive from './Responsive';

const meta = {
    component: Responsive,
    title: 'Components/Responsive/Features',
    decorators: [
        (Story) => (
            <div className="story-wrapper">
                <Story />
            </div>
        ),
    ],
} satisfies ComponentMeta<typeof Responsive>;

export default meta;

type Story = ComponentStory<typeof Responsive>;

export const Default: Story = () => (
    <Responsive>
        <img src="/img/works/work-1.jpg" alt="" />
    </Responsive>
);
Default.args = {};
