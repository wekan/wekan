'use strict';
// A changed password signs the account out everywhere else ("failure to
// invalidate session on password change"). Meteor's changePassword removes
// every login token but the session's that changed it, setPasswordAsync and
// resetPassword remove them all, and a session whose token is gone is closed;
// WeKan's HTTP routes check the token against the same list
// (server/lib/activeUser.js). password-change-other-sessions.e2e.js runs it in
// two browsers. This pins that WeKan keeps using those paths unchanged.
// Run: node tests/passwordChangeSessions.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
let passed = 0;
const test = (name, fn) => { fn(); passed += 1; console.log('  ok -', name); };

test('Member Settings / Change Password is Meteor\'s own changePassword form', () => {
  assert.match(read('client/components/users/userHeader.jade'), /template\(name="changePasswordPopup"\)\n {2}\+atForm\(state='changePwd'\)/);
});

test('the admin\'s Set password signs the user out everywhere (setPasswordAsync, logout by default)', () => {
  const users = read('server/models/users.js');
  const method = users.slice(users.indexOf('async setPassword(newPassword, userId) {'));
  const body = method.slice(0, method.indexOf('\n  },'));
  assert.match(body, /await Accounts\.setPasswordAsync\(userId, newPassword\);/);
  assert.doesNotMatch(body, /logout\s*:\s*false/);
});

test('HTTP routes take a session only from a token still in the list', () => {
  assert.match(read('server/lib/activeUser.js'), /'services\.resume\.loginTokens\.hashedToken': Accounts\._hashLoginToken\(token\)/);
});

test('negative: no password change keeps the other sessions', () => {
  const files = execFileSync('git', ['ls-files', 'server', 'models', 'packages', 'config', 'client', 'imports'],
    { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(f => /\.(js|cjs|mjs)$/.test(f) && !/\/tests?\//.test(f));
  const found = [];
  for (const f of files) {
    read(f).split('\n').forEach((line, i) => {
      if (/setPassword(?:Async)?\([^)]*logout\s*:\s*false/.test(line)) found.push(`${f}:${i + 1}`);
    });
  }
  // The one exception: an LDAP sign-in copies the directory's password into
  // WeKan while that user is signing in - not a change - and signing out the
  // session being created would refuse the login it serves.
  assert.deepEqual(found, ['packages/wekan-ldap/server/loginHandler.js:' + (read('packages/wekan-ldap/server/loginHandler.js')
    .split('\n').findIndex(l => /setPasswordAsync\(user\._id, loginRequest\.ldapPass, \{logout: false\}\)/.test(l)) + 1)]);
  assert.match(read('tests/playwright/specs/password-change-other-sessions.e2e.js'), /expect\.poll\(\(\) => userIdIn\(pageB\), \{ timeout: 30_000 \}\)\.toBe\(null\)/);
});

console.log(`passwordChangeSessions: ${passed} tests passed`);
