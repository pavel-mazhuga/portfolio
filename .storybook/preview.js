import './_storybook-fonts.scss';
import '../src/css/app.scss';
import './styles.scss';
// import 'focus-visible';
import { initialize, mswDecorator } from 'msw-storybook-addon';
import * as nextImage from 'next/image';

initialize();

Object.defineProperty(nextImage, 'default', {
    configurable: true,
    value: (props) => <img {...props} />,
});

export const parameters = {
    actions: { argTypesRegex: '^on[A-Z].*' },
    layout: 'centered',
    backgrounds: {
        default: 'light',
        values: [
            {
                name: 'dark',
                value: '#050a47',
            },
            {
                name: 'light',
                value: '#fff',
            },
        ],
    },
    controls: {
        matchers: {
            color: /(background|color)$/i,
            date: /Date$/,
        },
    },
};

export const decorators = [mswDecorator];
