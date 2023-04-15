const sortCSSmq = require('sort-css-media-queries');

const { browserslist } = require('./package.json');


module.exports = {
    plugins: [
       'postcss-easings',
       'postcss-focus-within',
       'postcss-focus-visible',
        ...(process.env.NODE_ENV === 'production'
            ? [
                  'postcss-clamp',
                 ['postcss-font-display', { display: 'swap' }],
                  'postcss-flexbugs-fixes',
                  ['autoprefixer', { browsers: browserslist.browsers }],
                  // this is always last
                  ['cssnano', {
                      preset: [
                          'default',
                          {
                              discardComments: { removeAll: true },
                          },
                      ],
                  }],
              ]
            : []),
    ],
};
