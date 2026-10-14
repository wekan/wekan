'use strict';

// #802: a tab per organization and team in All Boards, where their admins
// manage members; LDAP groups are only read, never written back.
// Run: node tests/groupMembers.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const g = require('../models/lib/groupMembers.js');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

const team = { _id: 't1', teamDisplayName: 'Devs' };
const ldapTeam = { _id: 't2', teamDisplayName: 'Ops', teamSyncMembersFromAuth: true };
const admin = { _id: 'a', teams: [{ teamId: 't1', isAdmin: true }, { teamId: 't2', isAdmin: true }] };
const member = { _id: 'm', teams: [{ teamId: 't1', teamDisplayName: 'Devs' }] };
const stranger = { _id: 's', teams: [] };

// Positive.
assert.equal(g.groupAccess(admin, 'team', team), 'manage', 'a team admin manages it');
assert.equal(g.groupAccess({ isAdmin: true }, 'team', team), 'manage', 'a site admin too');
assert.equal(g.groupAccess(member, 'team', team), 'view', 'a member sees it');
assert.deepEqual(g.addModifier(stranger, 'team', team), { $push: { teams: { teamId: 't1', teamDisplayName: 'Devs' } } });
assert.deepEqual(g.removeModifier(member, 'team', team), { $pull: { teams: { teamId: 't1' } } });
assert.deepEqual(g.myGroups({ orgs: [{ orgId: 'o', orgDisplayName: 'Acme', isAdmin: true }], teams: member.teams }),
  [{ kind: 'org', id: 'o', name: 'Acme', isAdmin: true }, { kind: 'team', id: 't1', name: 'Devs', isAdmin: false }]);
console.log('  ok - members see their groups; admins manage them');

// Negative.
assert.equal(g.groupAccess(admin, 'team', ldapTeam), 'view', 'a directory-synced group is never written back');
assert.equal(g.groupAccess({ isAdmin: true }, 'team', ldapTeam), 'view', 'not even by a site admin');
assert.equal(g.groupAccess(stranger, 'team', team), 'none');
assert.equal(g.groupAccess(member, 'nope', team), 'none');
assert.equal(g.addModifier(member, 'team', team), null, 'no double membership');
assert.equal(g.removeModifier(stranger, 'team', team), null);
console.log('  ok - strangers see nothing; LDAP groups and duplicates refused');

const server = read('server/groupMembers.js');
for (const m of ['addGroupMember', 'removeGroupMember']) {
  assert.match(server, new RegExp(`async ${m}\\([\\s\\S]{0,250}if \\(access !== 'manage'\\) throw new Meteor\\.Error\\('not-authorized'\\);`), m);
}
assert.match(server, /if \(access === 'none'\) throw new Meteor\.Error\('not-authorized'\);/);
assert.match(read('models/users.js'), /'teams\.\$\.isAdmin': \{[\s\S]{0,300}type: Boolean,\s*optional: true,/);
assert.doesNotMatch(read('models/users.js'), /USER_UPDATE_ALLOWED_EXACT = \[[^\]]*'(orgs|teams)'/, 'not writable from the client');
const jade = read('client/components/boards/boardsList.jade');
assert.match(jade, /each myGroups\s*\n\s*li\(class="menu-item \{\{#if isSelectedGroup\}\}active\{\{\/if\}\}"\)\s*\n\s*a\.js-select-group/);
assert.match(jade, /if canManageGroup\s*\n\s*form\.js-add-group-member/);
console.log('  ok - only managers change members; the tabs and panel');
console.log('\ngroupMembers: all tests passed');
