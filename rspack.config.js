const { defineConfig } = require('@meteorjs/rspack');
const path = require('path');

module.exports = defineConfig(Meteor => ({
  ...(Meteor.isClient && {
    experiments: {
      css: false,
    },
  }),
  // A development watcher lives for hours and rebuilds the same large Blaze graph
  // repeatedly. Rspack 1.x's experimental persistent cache retains JavaScript-side
  // serialization state across those rebuilds; on WeKan this can eventually fill a
  // 16 GB V8 heap. Production builds are short-lived and still benefit from the
  // persistent cache, so disable it only for `meteor run`.
  ...(Meteor.isRun && {
    cache: false,
    experiments: {
      ...(Meteor.isClient && { css: false }),
      cache: false,
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
  // mailparser (email to card, #794) does `require('nodemailer/lib/addressparser')`.
  // nodemailer 10 publishes that subpath as ESM for `import` and CommonJS for
  // `require`, and the server bundle resolved the require to the ESM build, so
  // the function arrived as `{ default }` and every parsed email failed with
  // "addressparser is not a function". Point the server at the CommonJS build,
  // which exports the function itself. tests/emailToCard.test.cjs pins this.
  ...(Meteor.isServer && {
    resolve: {
      alias: {
        'nodemailer/lib/addressparser$': path.resolve(__dirname, 'node_modules/nodemailer/dist/cjs/addressparser/index.js'),
      },
    },
  }),
  module: {
    rules: [
      ...(Meteor.isServer
        ? [{
            test: /\.i18n\.json$/,
            include: path.resolve(__dirname, 'imports/i18n/data'),
            // English is the synchronous fallback in tap.js on both platforms.
            exclude: /[/\\]en\.i18n\.json$/,
            type: 'javascript/auto',
            use: [path.resolve(__dirname, 'npm-packages/meteor-i18n-server-loader')],
          }]
        : []),
      {
        test: /\.jade$/,
        use: [path.resolve(__dirname, 'npm-packages/meteor-jade-loader')],
      },
      ...(Meteor.isClient
        ? [
            {
              test: /\.css$/i,
              // Meteor's base config assigns css/auto. Our loaders emit JS;
              // override the type so their style injection runs in Rspack 2.
              type: 'javascript/auto',
              use: ['style-loader', 'css-loader'],
            },
          ]
        : []),
    ],
  },
}));
