'use strict';

// #5539: "LDAP integration assumes users are in the same BaseDN as groups".
//
// Both group searches - getUserGroups (which feeds the login restriction, admin
// status sync, group->role sync and org/team sync) and isUserInGroup - searched
// `this.options.BaseDN`. That is the USER base. A directory that keeps
// ou=groups beside ou=people, which is a common layout and the reporter's, has
// no groups under it, so every group search came back empty; with
// LDAP_GROUP_FILTER_ENABLE=true, isUserInGroup then concluded "not a member" and
// refused the login. Nothing in the package could express where the groups are.
//
// LDAP_GROUP_BASEDN says where, and falls back to BaseDN when unset, so a
// directory with one subtree behaves exactly as before. The three USER searches
// must keep using BaseDN - pointing those at a group subtree would break
// authentication for everyone, which is why this pins WHICH searches moved.
//
// Run: node tests/ldapGroupBaseDn.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const src = read('packages/wekan-ldap/server/ldap.js');
const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

// Which method each `searchAll` call sits in: the file is one class, and the
// methods are two-space indented.
function searchesByMethod() {
  const out = {};
  let current = null;
  for (const line of code.split('\n')) {
    const m = /^ {2}(?:async )?([a-zA-Z_]\w*)\s*\(/.exec(line);
    if (m) current = m[1];
    if (/this\.searchAll\(/.test(line)) {
      (out[current] = out[current] || []).push(line.trim());
    }
  }
  return out;
}

console.log('ldapGroupBaseDn:');

const searches = searchesByMethod();

test('the two GROUP searches use the group base', () => {
  for (const method of ['getUserGroups', 'isUserInGroup']) {
    const calls = searches[method] || [];
    assert.ok(calls.length > 0, `${method} must search LDAP`);
    for (const call of calls) {
      assert.ok(/this\.searchAll\(this\.groupBaseDN\(\)/.test(call),
        `${method} searches the USER base, so a directory with groups in another `
        + `subtree finds none: ${call.slice(0, 70)}`);
    }
  }
});

test('and the USER searches still use the user base', () => {
  // The other half of the fix, and the more dangerous one to get wrong: these
  // three find the account that is logging in.
  for (const method of ['searchUsers', 'getUserById', 'getUserByUsername']) {
    const calls = searches[method] || [];
    assert.ok(calls.length > 0, `${method} must search LDAP`);
    for (const call of calls) {
      assert.ok(/this\.searchAll\(this\.options\.BaseDN/.test(call),
        `${method} must keep searching the user base - pointing it at a group `
        + `subtree breaks login for everyone: ${call.slice(0, 70)}`);
    }
  }
});

test('the group base comes from LDAP_GROUP_BASEDN', () => {
  assert.ok(/GroupBaseDN\s*:\s*this\.constructor\.settings_get\('LDAP_GROUP_BASEDN'\)/.test(code),
    'the option must be read like every other LDAP setting');
});

test('an unset or blank group base falls back to the user base', () => {
  // The compatibility half: an install that never had groups in a separate
  // subtree must not change behaviour, and an env var that is present but empty
  // is one somebody meant to fill in - searching "" would search the directory
  // root instead.
  const at = code.indexOf('groupBaseDN()');
  assert.notStrictEqual(at, -1, 'the accessor must exist');
  const fn = code.slice(at, code.indexOf('\n  }', at));
  assert.ok(/typeof groupBase === 'string'/.test(fn) && /trim\(\) !== ''/.test(fn),
    'a blank string counts as unset');
  assert.ok(/return this\.options\.BaseDN/.test(fn),
    'and unset means the user base, exactly as before');
});

test('the new variable is documented where the others are', () => {
  // An LDAP setting nobody can find is a setting that does not exist. Both the
  // reference docs and the compose file list the rest of them.
  for (const [file, text] of [['docs/Features/Login/LDAP.md', read('docs/Features/Login/LDAP.md')],
    ['docker-compose.yml', read('docker-compose.yml')]]) {
    assert.ok(/LDAP_GROUP_BASEDN/.test(text), `${file} must document LDAP_GROUP_BASEDN`);
    assert.ok(/LDAP_BASEDN/.test(text), `${file} still documents the user base too`);
  }
});

console.log(`\n${passed} tests passed`);
