/* global Package */

Package.describe({
  name: 'wekan-accounts-lockout',
  version: '1.1.0',
  summary: 'Meteor package for locking user accounts and stopping brute force attacks',
  git: 'https://github.com/lucasantoniassi/meteor-accounts-lockout.git',
  documentation: 'README.md',
});

Package.onUse((api) => {
  api.versionsFrom(['2.16', '3.0']);
  api.use([
    'ecmascript',
    'accounts-password',
  ]);
  // SERVER ONLY. `mainModule('accounts-lockout.js')` with no architecture loads
  // this package into the BROWSER as well, and a brute-force lockout has no
  // business there: nothing in client/ imports it (only
  // server/accounts-lockout-config.js and server/methods/lockoutSettings.js do),
  // and shipping the decision to the client would hand an attacker the rules.
  //
  // It also broke the client outright. lockoutScope.js hashes the source address
  // with `require('crypto')`, so the browser bundle pulled in crypto-browserify,
  // which pulls in cipher-base, which does `require('stream')` - and the page
  // died on load with "Cannot find module 'stream'" before WeKan drew anything.
  // tests/packagesLoadOnTheRightArch.test.cjs is the guard.
  api.mainModule('accounts-lockout.js', 'server');
});
