const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');

// pawoo extensions: set .postcssrc.yml path
// https://github.com/tootsuite/mastodon/issues/3998
const postcssConfig = path.resolve(__dirname, '../../../.postcssrc.yml');

module.exports = {
  test: /\.s?css$/i,
  use: [
    MiniCssExtractPlugin.loader,
    {
      loader: 'css-loader',
      options: {
        sourceMap: true,
        importLoaders: 2,
        localIdentName: '[name]__[local]___[hash:base64:5]',
      },
    },
    {
      loader: 'postcss-loader',
      options: {
        sourceMap: true,
        config: { path: postcssConfig },
      },
    },
    {
      loader: 'sass-loader',
      options: {
        implementation: require('sass'),
        sourceMap: true,
      },
    },
  ],
};
