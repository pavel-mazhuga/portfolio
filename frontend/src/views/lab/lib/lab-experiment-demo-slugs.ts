const demoLoaders = {
    ...import.meta.glob<{ default: unknown }>('../../../features/experiments/*/Demo.ts'),
    ...import.meta.glob<{ default: unknown }>('../../../features/experiments/*/demo.ts'),
};

export const labExperimentDemoSlugs = [
    ...new Set(
        Object.keys(demoLoaders)
            .map((path) => {
                const match = path.match(
                    /^\.\.\/\.\.\/\.\.\/features\/experiments\/([^/]+)\/[Dd]emo\.ts$/,
                );

                return match?.[1];
            })
            .filter((slug): slug is string => Boolean(slug)),
    ),
];
