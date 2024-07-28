const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = withBundleAnalyzer({
    reactStrictMode: true,
    // typescript: {
    //     // !! WARN !!
    //     // Dangerously allow production builds to successfully complete even if
    //     // your project has type errors.
    //     // !! WARN !!
    //     ignoreBuildErrors: true,
    // },
    images: {
        formats: ['image/webp'],
        // domains: [],
        minimumCacheTTL: 60 * 60 * 24 * 60 * 3, // хранить сгенерированные изображения в кэше 3 месяца
    },
    webpack: (config) => {
        config.module.rules.push({
            test: /\.(png|jpg|gif|svg|glb|gltf)$/i,
            type: 'asset',
            resourceQuery: /url/, // *.svg?url
        });

        config.module.rules.push({
            test: /\.(glb|gltf|ktx2|wav|mp3)$/i,
            type: 'asset/resource',
        });

        config.module.rules.push({
            test: /\.svg$/i,
            issuer: { and: [/\.(js|ts|md)x?$/] },
            resourceQuery: { not: [/url/] },
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

        config.module.rules.push({
            test: /\.(glsl|frag|vert)$/,
            use: [require.resolve('@davcri/webpack-glsl-loader'), require.resolve('glslify-loader')],
        });

        config.experiments = {
            topLevelAwait: true,
            layers: true,
        };

        return config;
    },
});

module.exports = nextConfig;
