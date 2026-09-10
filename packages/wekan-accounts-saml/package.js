Package.describe({
  summary: "SAML 2.0 (SP-initiated) support for Meteor accounts",
  version: "0.1.0",
  name: "wekan-accounts-saml",
  git: "https://github.com/wekan/wekan.git",
});

Package.onUse(function(api) {
  api.versionsFrom(['2.16', '3.0']);
  api.use('ecmascript');
  api.use('webapp', 'server');
  api.use('service-configuration', 'server');
  api.use('accounts-base', ['client', 'server']);
  // Export Accounts (etc) to packages using this one.
  api.imply('accounts-base', ['client', 'server']);

  api.addFiles('saml_client.js', 'client');
  api.addFiles('saml_login_button.css', 'client');
  api.addFiles('saml_server.js', 'server');
});

Npm.depends({
  // The actively maintained, MIT-licensed fork that does the SAML 2.0
  // protocol work (AuthnRequest generation, response/assertion parsing,
  // XML-DSig signature verification). This package only wires that up to
  // Meteor's accounts system (login handler, HTTP endpoints, login button);
  // it does not reimplement any SAML/XML-signature handling itself. License
  // verified directly from https://github.com/node-saml/node-saml/blob/master/LICENSE
  // (MIT, (c) Henri Bergius, Michael Bosworth).
  '@node-saml/node-saml': '5.1.0',
});
