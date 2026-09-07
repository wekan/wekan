'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const service = read('server/lib/adminTeams.js');
const methods = read('server/models/team.js');
const adminMethods = read('server/methods/adminTeams.js');
const client = read('client/components/settings/peopleBody.js');
const pages = read('server/lib/legacyHtml4Pages.js');
const route = read('server/legacyHtml4.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
console.log('legacyHtml4AdminPeopleTeams:');

test('HTML4 and Jade mutations share one guarded Teams service', () => {
  assert.ok(/async function requireSiteAdmin[\s\S]*actor\?\.isAdmin === true/.test(service));
  assert.ok(/bleed: 'TeamBleed'/.test(service));
  for (const name of ['createTeamForAdmin', 'updateTeamForAdmin',
    'setTeamFeatureForAdmin', 'setAllTeamsFeatureForAdmin']) {
    assert.ok(methods.includes(name), `Meteor methods miss ${name}`);
    assert.ok(route.includes(name), `HTML4 route misses ${name}`);
  }
  assert.ok(adminMethods.includes('deleteTeamForAdmin'));
  assert.ok(adminMethods.includes('setBoardMembersSameTeamForAdmin'));
  assert.ok(!/Settings\.update\(setting\._id[\s\S]*boardMembersFromSameTeamOnly/.test(client));
  assert.ok(!/Team\.remove\(teamId\)/.test(client));
});

test('the service bounds fields, escapes literal search and guards deletion', () => {
  assert.ok(service.includes('TEAM_FEATURE_FIELDS'));
  assert.ok(service.includes('TEAM_PUBLIC_FIELDS'));
  assert.ok(service.includes('escapeForRegex(search)'));
  assert.ok(/slice\(0, 500\)/.test(service));
  assert.ok(/find\(\{ 'teams\.teamId': teamId \}\)\.countAsync/.test(service));
  assert.ok(/non-empty team[\s\S]*'validation', 'medium'/.test(service));
});

test('HTML4 retains every Teams operation and all ten columns', () => {
  assert.ok(/path !== '\/admin\/people\/teams'/.test(pages));
  for (const operation of ['show-create-team', 'create-team', 'show-edit-team',
    'update-team', 'set-team-feature', 'set-all-teams-feature',
    'set-board-members-same-team', 'request-delete-team', 'delete-team']) {
    assert.ok(pages.includes(operation) || route.includes(operation), `missing ${operation}`);
  }
  assert.ok(/columns: \[tr\(translate, 'actions'[\s\S]*team-sync-members-from-auth/.test(pages));
  assert.ok(/uiSearchForm/.test(pages));
  assert.ok(/adminPeopleTeamsPage[\s\S]*adminPeopleBaselinePage/.test(pages));
});

console.log(`\nlegacyHtml4AdminPeopleTeams: ${passed} tests passed`);
