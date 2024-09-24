/* global Package */

Package.describe({
  name: 'wekan-accounts-lockout',
  version: '1.0.0',
  summary: 'Meteor package for locking user accounts and stopping brute force attacks',
  git: 'https://github.com/lucasantoniassi/meteor-accounts-lockout.git',
  documentation: 'README.md',
});

Package.onUse((api) => {
  api.use([
    'ecmascript',
    'accounts-password',
  ]);
  api.mainModule('accounts-lockout.js');
});
