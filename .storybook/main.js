const path = require('path');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const configurePostCSS = require('../postcss.config.js');

module.exports = {
    core: {
        builder: 'webpack5',
    },
    stories: ['../**/*.stories.@(js|jsx|ts|tsx|mdx)'],
    staticDirs: ['../public'],
    addons: [
        '@storybook/addon-links',
        '@storybook/addon-essentials',
        '@storybook/addon-interactions',
        '@storybook/addon-a11y',
        'storybook-addon-designs',
        // {
        //     name: 'storybook-addon-next',
        //     options: {
        //         nextConfigPath: path.resolve(__dirname, '../next.config.js'),
        //     },
        // },
       
    ],
    framework: '@storybook/react',
    webpackFinal: async (config, { configType }) => {
        config.resolve.plugins = [new TsconfigPathsPlugin()];
        config.resolve.modules.push(path.resolve(__dirname, '../'));

        config.module.rules.push({
            test: /\.ce\.(css|scss)$/i,
            use: [
                {
                    loader: 'raw-loader',
                },
                {
                    loader: 'extract-loader',
                },
                {
                    loader: 'css-loader',
                },
                {
                    loader: 'postcss-loader',
                    options: {
                        postcssOptions: configurePostCSS,
                    },
                },
                {
                    loader: 'sass-loader',
                },
            ],
            type: 'javascript/auto',
        });

        config.module.rules.push({
            test: /\.(css|scss)$/i,
            exclude: /\.ce\.(css|scss)$/i,
            use: [
                'style-loader',
                'css-loader',
                {
                    loader: 'postcss-loader',
                    options: {
                        postcssOptions: configurePostCSS,
                    },
                },
                'sass-loader',
            ],
        });

        const fileLoaderRule = config.module.rules.find(
            (rule) => rule.test && rule.test.test('.svg'),
        );
        fileLoaderRule.exclude = /\.svg$/;

        // TO-DO лоадер для картинок
        config.module.rules.push({
            test: /\.svg$/i,
            issuer: { and: [/\.(js|ts|md)x?$/] },
            use: [
                {
                    loader: '@svgr/webpack',
                    options: {
                        prettier: false,
                        svgo: true,
                        svgoConfig: {
                            plugins: [
                                {
                                    name: 'preset-default',
                                    params: {
                                        overrides: { removeViewBox: false },
                                    },
                                },
                            ],
                        },
                        titleProp: true,
                    },
                },
            ],
        });

        return config;
    },
    features: {
        previewMdx2: true,
    },
};
