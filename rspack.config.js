const { defineConfig } = require('@meteorjs/rspack');
const path = require('path');

module.exports = defineConfig(Meteor => ({
  ...(Meteor.isClient && {
    experiments: {
      css: false,
    },
  }),
  module: {
    rules: [
      {
        test: /\.jade$/,
        use: [path.resolve(__dirname, 'npm-packages/meteor-jade-loader')],
      },
      ...(Meteor.isClient
        ? [
            {
              test: /\.css$/i,
              use: ['style-loader', 'css-loader'],
            },
          ]
        : []),
    ],
  },
}));
