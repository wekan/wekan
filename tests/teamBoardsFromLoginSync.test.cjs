'use strict';
// #4178 / #4593: a user added to a team becomes a normal member of the boards
// that team is assigned to. The Admin Panel paths did that
// (addUserToTeamBoards, server/models/users.js), but the login providers'
// group syncs - LDAP (server/ldapGroupSync.js) and OIDC
// (packages/wekan-oidc/loginHandler.js) - pushed the team onto the user with a
// plain $push, so LDAP- and OIDC-synced team members could see the team's
// boards but not work on them.
//
// Run: node tests/teamBoardsFromLoginSync.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
console.log('teamBoardsFromLoginSync:');

test('the helper is shared: exported for the app, global for the OIDC package', () => {
  const users = read('server/models/users.js');
  assert.match(users, /^export \{ addUserToTeamBoards \};$/m);
  assert.match(users, /^globalThis\.__wekanAddUserToTeamBoards = addUserToTeamBoards;$/m);
});

test('LDAP: the new team is followed by its boards', () => {
  const src = read('server/ldapGroupSync.js');
  assert.match(src, /import \{ addUserToTeamBoards \} from '\/server\/models\/users';/);
  assert.match(src, /\$push: \{ teams: entry \} \}\);\s*(\/\/[^\n]*\n\s*)*await addUserToTeamBoards\(userId, user\.teams \|\| \[\], \[\.\.\.\(user\.teams \|\| \[\]\), entry\]\);/);
});

test('OIDC: the teams before the push are read, and the new ones are followed by their boards', () => {
  const src = read('packages/wekan-oidc/loginHandler.js');
  assert.match(src, /const teamsBefore = \(await Meteor\.users\.findOneAsync\(\{ _id: user\._id \}, \{ fields: \{ teams: 1 \} \}\)\)\?\.teams \|\| \[\];\s*await Meteor\.users\.updateAsync\(\{ _id: user\._id \}, \{ \$push: {2}\{'teams'/);
  assert.match(src, /await globalThis\.__wekanAddUserToTeamBoards\(user\._id, teamsBefore, \[\.\.\.teamsBefore, \.\.\.teamArray\]\);/);
});

// Negative, whole tree: no code adds a team to a user without the boards.
test('negative: every $push onto a user\'s teams is followed by the board sync', () => {
  const files = execFileSync('git', ['ls-files', 'server', 'models', 'packages'], { cwd: ROOT, encoding: 'utf8' })
    .split('\n').filter(f => /\.js$/.test(f) && !/\/tests?\//.test(f));
  const offenders = [];
  for (const rel of files) {
    const lines = read(rel).split('\n');
    lines.forEach((line, i) => {
      if (!/\$push:\s*\{\s*['"]?teams['"]?\s*:/.test(line) || /Boards\./.test(line)) return;
      const after = lines.slice(i, i + 8).join('\n');
      if (!/[aA]ddUserToTeamBoards/.test(after)) offenders.push(`${rel}:${i + 1}`);
    });
  }
  assert.deepEqual(offenders, []);
});

console.log(`\nteamBoardsFromLoginSync: ${passed} tests passed`);
