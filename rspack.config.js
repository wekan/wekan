const { defineConfig } = require('@meteorjs/rspack');
const path = require('path');

module.exports = defineConfig(Meteor => ({
  module: {
    rules: [
      {
        test: /\.jade$/,
        use: [path.resolve(__dirname, 'packages/meteor-jade-loader')],
      },
    ],
  },
}));
