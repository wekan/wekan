'use strict';

Package.describe({
  summary: 'Meteor sign up and sign in templates core package.',
  version: '1.14.2',
  name: 'useraccounts:core',
  git: 'https://github.com/meteor-useraccounts/core.git',
});

Package.onUse(function(api) {
  //api.versionsFrom('METEOR@1.0.3');

  api.use([
    'accounts-base',
    'check',
    'underscore',
    'reactive-var',
  ], ['client', 'server']);

  api.use([
    'blaze',
    'reactive-dict',
    'templating',
    'jquery'
  ], 'client');

  api.use([
    'http'
  ], 'server');

  api.imply([
    'accounts-base',
    'softwarerero:accounts-t9n@1.3.3',
  ], ['client', 'server']);

  api.imply([
    'templating',
  ], ['client']);

  api.addFiles([
    'lib/field.js',
    'lib/core.js',
    'lib/server.js',
    'lib/methods.js',
    'lib/server_methods.js',
  ], ['server']);

  api.addFiles([
    'lib/utils.js',
    'lib/field.js',
    'lib/core.js',
    'lib/client.js',
    'lib/templates_helpers/at_error.js',
    'lib/templates_helpers/at_form.js',
    'lib/templates_helpers/at_input.js',
    'lib/templates_helpers/at_nav_button.js',
    'lib/templates_helpers/at_oauth.js',
    'lib/templates_helpers/at_pwd_form.js',
    'lib/templates_helpers/at_pwd_form_btn.js',
    'lib/templates_helpers/at_pwd_link.js',
    'lib/templates_helpers/at_reCaptcha.js',
    'lib/templates_helpers/at_resend_verification_email_link.js',
    'lib/templates_helpers/at_result.js',
    'lib/templates_helpers/at_sep.js',
    'lib/templates_helpers/at_signin_link.js',
    'lib/templates_helpers/at_signup_link.js',
    'lib/templates_helpers/at_social.js',
    'lib/templates_helpers/at_terms_link.js',
    'lib/templates_helpers/at_title.js',
    'lib/templates_helpers/at_message.js',
    'lib/templates_helpers/ensure_signed_in.html',
    'lib/templates_helpers/ensure_signed_in.js',
    'lib/methods.js',
  ], ['client']);

  api.export([
    'AccountsTemplates',
  ], ['client', 'server']);
});

Package.onTest(function(api) {
  api.use('useraccounts:core@1.14.2');

  api.use([
    'accounts-password',
    'tinytest',
    'test-helpers',
    'underscore',
  ], ['client', 'server']);

  api.addFiles([
    'tests/tests.js',
  ], ['client', 'server']);
});
