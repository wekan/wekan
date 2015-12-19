 /* eslint-disable */
var webpack = require('webpack');

var babelSettings = {
  presets: ['react', 'es2015', 'stage-0'],
  plugins: ['transform-es2015-modules-amd']
};

module.exports = {
  entry: './entry',
  module: {
    loaders: [
      { test: /\.jsx?$/, loader: 'babel', query: babelSettings, exclude: /node_modules/ }
    ]
  }
};
