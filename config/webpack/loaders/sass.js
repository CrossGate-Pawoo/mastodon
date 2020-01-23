const ExtractTextPlugin = require('extract-text-webpack-plugin');
const { env } = require('../configuration.js');
const path = require('path');

// pawoo extensions: set .postcssrc.yml path
// https://github.com/tootsuite/mastodon/issues/3998
const postcssConfig = path.resolve(__dirname, '../../../.postcssrc.yml');

module.exports = {
  test: /\.(scss|sass|css)$/i,
  use: ExtractTextPlugin.extract({
    fallback: 'style-loader',
    use: [
      { loader: 'css-loader', options: { minimize: env.NODE_ENV === 'production' } },
      { loader: 'postcss-loader', options: { sourceMap: true, config: { path: postcssConfig } } },
      'resolve-url-loader',
      'sass-loader',
    ],
  }),
};
