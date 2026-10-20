'use strict';

// Adding a colleague to a board (Board menu > Members > +):
// 1. inviteUserToBoard matched the typed email address case-sensitively. LDAP
//    and OIDC store the address as the directory spells it, so typing an
//    existing colleague's address in lower case found nobody, and WeKan tried
//    to create a new account instead - refused ("This user is not created")
//    with registration disabled, else a raw 403 "Email already exists".
// 2. searchUsers read 5 users and filtered afterwards, so other matches ahead
//    of the colleague could hide them; disabled accounts were offered although
//    inviting them is refused.
// Run: node tests/inviteMemberEmailCase.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '../server/models/users.js'), 'utf8');
const invite = src.split('async inviteUserToBoard(')[1].split('\n  },\n')[0];
const search = src.split('async searchUsers(query, boardId)')[1].split('\n  },\n')[0];

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

test('invite by email matches the address case-insensitively and anchored', () => {
  assert.match(invite, /address: new RegExp\(`\^\$\{escapeForRegex\(username\.trim\(\)\)\}\$`, 'i'\)/);
  assert.doesNotMatch(invite, /\$elemMatch: \{ address: username \}/);
});

test('the regex used matches the same address in any case, and only that one', () => {
  // The same escape-string-regexp the server imports - not a copy of it, which
  // tests/incompleteEscaping.test.cjs refuses anywhere in the tree.
  const escapeModule = require('escape-string-regexp');
  const escape = escapeModule.default || escapeModule;
  const re = new RegExp(`^${escape(' jan.jansen@example.com '.trim())}$`, 'i');
  assert.ok(re.test('Jan.Jansen@Example.com'));
  assert.ok(!re.test('janXjansen@example.com'), 'a dot is literal');
  assert.ok(!re.test('mr.jan.jansen@example.com'), 'anchored');
});

test('search filters before limiting to five results', () => {
  assert.match(search, /limit: 50,/);
  assert.match(search, /filteredUsers\.slice\(0, 5\)/);
  assert.match(search, /filteredUsers = filteredUsers\.filter\(candidate =>/);
});

test('search does not offer disabled accounts', () => {
  assert.match(search, /candidate\.loginDisabled !== true/);
  assert.match(search, /loginDisabled: 1,/);
});

console.log(`\n${passed} tests passed`);
