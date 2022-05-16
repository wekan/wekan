Package.describe({
  summary: "OpenID Connect (OIDC) for Meteor accounts",
  version: "1.0.10",
  name: "wekan-accounts-oidc",
  git: "https://github.com/wekan/meteor-accounts-oidc.git",

});

Package.onUse(function(api) {
  api.use('accounts-base', ['client', 'server']);
  // Export Accounts (etc) to packages using this one.
  api.imply('accounts-base', ['client', 'server']);
  api.use('accounts-oauth', ['client', 'server']);
  api.use('wekan-oidc', ['client', 'server']);

  api.addFiles('oidc_login_button.css', 'client');

  api.addFiles('oidc.js');
});
