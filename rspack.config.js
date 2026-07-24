const { defineConfig } = require('@meteorjs/rspack');
const path = require('path');

module.exports = defineConfig(Meteor => ({
  ...(Meteor.isClient && {
    experiments: {
      css: false,
    },
  }),
  // Dev server only (`meteor run`; a production build has no devServer and no overlay
  // at all). webpack-dev-server's overlay catches every window 'error' event and covers
  // the whole app with a modal "Uncaught runtime errors:" panel. Browsers sanitise an
  // error thrown by a CROSS-ORIGIN script to the content-free message "Script error."
  // with no stack and no error object, and iOS Safari raises those from its own
  // machinery and from content blockers / extensions — e.g. when the Share sheet is
  // opened to "Add to Home Screen". WeKan's own bundle is same-origin (no CDN_URL), so
  // a real WeKan error always arrives with its actual message and stack; "Script error."
  // never comes from our code and there is nothing to act on. Ignore exactly that
  // message so the overlay stops hiding the app on iPad, and keep every other runtime
  // error — and all compile errors — showing as before.
  //
  // runtimeErrors accepts (error) => boolean. webpack-dev-server serialises it with
  // toString() and rebuilds it client-side with new Function(), so it must stay
  // self-contained: no closure variables, no imports (tests/devOverlayRuntimeErrors.test.cjs
  // round-trips it exactly the way the dev server does).
  ...(Meteor.isClient && Meteor.isRun && {
    devServer: {
      client: {
        overlay: {
          errors: true,
          warnings: false,
          runtimeErrors: error =>
            !/^script error\.?$/i.test((error && error.message) || ''),
        },
      },
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
