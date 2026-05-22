Package.describe({
  summary: "CAS support for accounts",
  version: "0.2.0",
  name: "wekan-accounts-cas",
  git: "https://github.com/wekan/meteor-accounts-cas"
});

Package.onUse(function(api) {
  api.versionsFrom(['2.16', '3.0']);
  api.use('ecmascript');
  api.use('routepolicy', 'server');
  api.use('webapp', 'server');
  api.use('accounts-base', ['client', 'server']);
  // Export Accounts (etc) to packages using this one.
  api.imply('accounts-base', ['client', 'server']);
  api.addFiles('cas_client.js', 'web.browser');
  api.addFiles('cas_client_cordova.js', 'web.cordova');
  api.addFiles('cas_server.js', 'server');

});

Npm.depends({
  xml2js: "0.5.0"
});

Cordova.depends({
  'cordova-plugin-inappbrowser': '1.2.0'
});
