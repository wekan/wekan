'use strict';

// #5141: a board admin may add only the organizations and teams they belong to.
// Run: node tests/boardGroupLinks.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { forbiddenNewGroupIds, offeredGroups } = require('../models/lib/boardGroupLinks.js');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

// Positive.
assert.deepEqual(forbiddenNewGroupIds({ previous: [], next: [{ teamId: 'mine' }], key: 'teamId', ownIds: ['mine'] }), []);
assert.deepEqual(forbiddenNewGroupIds({ previous: [{ teamId: 'other' }], next: [{ teamId: 'other' }, { teamId: 'mine' }], key: 'teamId', ownIds: ['mine'] }), [],
  'a group somebody else added stays');
assert.deepEqual(forbiddenNewGroupIds({ previous: [{ orgId: 'x' }], next: [], key: 'orgId', ownIds: [] }), [], 'removing is always allowed');
assert.deepEqual(forbiddenNewGroupIds({ previous: [], next: [{ orgId: 'any' }], key: 'orgId', isSiteAdmin: true }), [], 'site admins add any');
assert.deepEqual(offeredGroups([{ _id: 'a' }, { _id: 'b' }], ['b'], false), [{ _id: 'b' }]);
assert.deepEqual(offeredGroups([{ _id: 'a' }, { _id: 'b' }], [], true).length, 2);
console.log('  ok - own groups, existing links and removals are allowed');

// Negative.
assert.deepEqual(forbiddenNewGroupIds({ previous: [], next: [{ teamId: 'theirs' }, { teamId: 'mine' }], key: 'teamId', ownIds: ['mine'] }), ['theirs']);
assert.deepEqual(forbiddenNewGroupIds({ previous: [], next: [{ orgId: 'o' }], key: 'orgId', ownIds: undefined }), ['o']);
assert.deepEqual(offeredGroups([{ _id: 'a' }], ['b'], false), []);
console.log('  ok - a group the admin is not in is refused, and not offered');

// Server: both methods check before writing; publications give non-admins their own only.
const boards = read('server/models/boards.js');
for (const [name, key] of [['setBoardOrgs', 'orgId'], ['setBoardTeams', 'teamId']]) {
  const fn = boards.slice(boards.indexOf(`async ${name}(`), boards.indexOf('await Boards.updateAsync(currBoardId', boards.indexOf(`async ${name}(`)));
  assert.match(fn, new RegExp(`forbiddenNewGroupIds\\(\\{ previous: board\\.\\w+, next: \\w+, key: '${key}',`), name);
  assert.match(fn, /\.length\) \{\s*throw new Meteor\.Error\('not-authorized'/, `${name} refuses before writing`);
}
for (const [f, field] of [['server/publications/team.js', 'teams'], ['server/publications/org.js', 'orgs']]) {
  const pub = read(f);
  assert.match(pub, new RegExp(`\\} else if \\(user\\) \\{[\\s\\S]{0,300}const ownIds = \\(user\\.${field} \\|\\| \\[\\]\\)`), f);
  assert.match(pub, /\{ _id: \{ \$in: ownIds \} \}, \{ fields: \{ \w+DisplayName: 1, \w+ShortName: 1 \} \}/, `${f}: names only`);
}
const sidebar = read('client/components/sidebar/sidebar.js');
assert.match(sidebar, /orgsDatas\(\) \{[\s\S]{0,300}offeredGroups\(/);
assert.match(sidebar, /teamsDatas\(\) \{[\s\S]{0,300}offeredGroups\(/);
console.log('  ok - the server refuses, the pickers offer only own groups');

console.log('\nboardGroupLinks: all tests passed');
