Package.describe({
  name: 'wekan-ldap',
  version: '0.1.0',
  // Brief, one-line summary of the package.
  summary: 'Basic meteor login with ldap',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/wekan/wekan-ldap',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});


Package.onUse(function(api) {
	api.use('ecmascript');
	api.use('underscore');
	api.use('sha');
	api.use('templating', 'client');

	api.use('accounts-base', 'server');
	api.use('accounts-password', 'server');
	api.use('quave:synced-cron', 'server');
	api.addFiles('client/loginHelper.js', 'client');

	api.mainModule('server/index.js', 'server');
});

Npm.depends({
	'ldapjs': '2.3.3',
	'limax': '4.1.0'
});
