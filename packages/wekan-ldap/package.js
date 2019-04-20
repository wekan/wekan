Package.describe({
  name: 'wekan:wekan-ldap',
  version: '0.0.2',
  // Brief, one-line summary of the package.
  summary: 'Basic meteor login with ldap',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/wekan/wekan-ldap',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});


Package.onUse(function(api) {
  api.versionsFrom('1.0.3.1');
	api.use('yasaricli:slugify@0.0.5');
	api.use('ecmascript@0.9.0');
	api.use('underscore');
	api.use('sha');
	api.use('templating', 'client');

	api.use('accounts-base', 'server');
	api.use('accounts-password', 'server');

	api.addFiles('client/loginHelper.js', 'client');

	api.mainModule('server/index.js', 'server');
});

Npm.depends({
  ldapjs: '1.0.2',
});