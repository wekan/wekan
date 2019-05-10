Package.describe({
  summary: "CAS support for accounts",
  version: "0.1.0",
  name: "wekan:accounts-cas",
  git: "https://github.com/wekan/meteor-accounts-cas"
});

Package.onUse(function(api) {
  api.versionsFrom('METEOR@1.3.5.1');
  api.use('routepolicy', 'server');
  api.use('webapp', 'server');
  api.use('accounts-base', ['client', 'server']);
  // Export Accounts (etc) to packages using this one.
  api.imply('accounts-base', ['client', 'server']);
  api.use('underscore');
  api.add_files('cas_client.js', 'web.browser');
  api.add_files('cas_client_cordova.js', 'web.cordova');
  api.add_files('cas_server.js', 'server');

});

Npm.depends({
  xml2js: "0.4.17",
  cas: "https://github.com/anrizal/node-cas/tarball/2baed530842e7a437f8f71b9346bcac8e84773cc"
});

Cordova.depends({
  'cordova-plugin-inappbrowser': '1.2.0'
});
