const path = require('path');
const glob = require('glob');
const slash = require('slash');
const weblog = require('webpack-log');
const childProcess = require('child_process');

const logger = weblog({ name: 'fonts-subsets' });

const FONTS_SRC = `./src/fonts/src`;
const FONTS_DIST = `./src/fonts`;

glob(
    `${FONTS_SRC}/**/*.{ttf,otf}`,
    {
        ignore: [],
    },
    (error, files) => {
        if (error) throw error;

        const subsetsCommandSuffix = ' --unicodes-file=fonts-subsets.txt';

        files.forEach((filename) => {
            const extname = path.extname(filename);
            const ext = path.extname(filename).replace('.', '');
            const source = slash(path.relative(__dirname, filename));
            const target = slash(path.relative(__dirname, path.join(FONTS_DIST, path.relative(FONTS_SRC, filename))));

            const basename = path.basename(target, extname);
            const dirname = slash(path.dirname(target));

            logger.info(`${source} --> ${dirname}/${basename}.woff2`);
            childProcess.execSync(
                `pyftsubset ${source} --output-file=${dirname}/${basename}.woff2 --flavor=woff2 ${subsetsCommandSuffix}`,
                { stdio: 'inherit' },
            );
        });
    },
);
