'use strict';

// #4510: Admin Panel / People, the "Team" filter. An admin with several teams
// asked to narrow the /people list to one team's members, the way the Show
// filter already narrows it to locked/active/inactive/admin users.
//
// A user's team membership lives in their own `teams` array (models/users.js:
// `teams.$.teamId`), so the filter is a plain match on that embedded field -
// the same shape the Team membership popups already read. This is pinned as a
// source test (no Meteor/browser needed) rather than driving Blaze, matching
// the other peopleBody.js regression tests in this suite.
//
// Run: node tests/peopleTeamFilter.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('peopleTeamFilter:');

const peopleBodyJs = read('client/components/settings/peopleBody.js');
const tablePageJade = read('client/components/settings/tablePage.jade');
const enI18n = JSON.parse(read('imports/i18n/data/en.i18n.json'));

test('the pane keeps a teamFilterId, separate from the Show filter', () => {
  assert.ok(/this\.teamFilterId\s*=\s*new ReactiveVar\(''\)/.test(peopleBodyJs),
    'expected a teamFilterId ReactiveVar in Template.people.onCreated');
});

test('filterPeople() narrows the query to the selected team', () => {
  const fn = peopleBodyJs.match(/this\.filterPeople = \(\) => \{[\s\S]*?\n  \};/);
  assert.ok(fn, 'filterPeople() not found');
  assert.ok(/'teams\.teamId'\]\s*=\s*teamId/.test(fn[0]),
    'expected filterPeople() to set query["teams.teamId"] from teamFilterId');
});

test('the controls row declares a second filter, id "team"', () => {
  assert.ok(/id:\s*'team',\s*\n\s*labelKey:\s*'admin-people-filter-team'/.test(peopleBodyJs),
    'expected a buildFilters() entry with id "team"');
  // Populated from every team, not just the current page of the paginated
  // Teams table - the same reason editUserPopup's team checkboxes read
  // ReactiveCache.getTeams({}) rather than tpl.findTeamsOptions.
  assert.ok(/ReactiveCache\.getTeams\(\{\}, \{ sort: \{ teamDisplayName: 1 \} \}\)/.test(peopleBodyJs),
    'expected the team filter options to come from every team');
});

test('the change handler routes by data-filter to the right ReactiveVar', () => {
  const handler = peopleBodyJs.match(
    /'change \.js-table-page-filter'\(event, tpl\) \{[\s\S]*?\n  \},/);
  assert.ok(handler, 'change .js-table-page-filter handler not found');
  assert.ok(/data\('filter'\)/.test(handler[0]),
    'expected the handler to read data-filter to tell the two selects apart');
  assert.ok(/teamFilterId\.set/.test(handler[0]),
    'expected the handler to write teamFilterId when the team select changes');
});

test('the shared controls row can render more than one filter select, keyed by data-filter', () => {
  assert.ok(/select\.js-table-page-filter\(data-filter="\{\{id\}\}"/.test(tablePageJade),
    'expected tablePage.jade to key each filter select by its own id');
});

test('the two new i18n keys exist in English, and only that pane still reads Show\'s old keys', () => {
  assert.strictEqual(enI18n['admin-people-filter-team'], 'Team:');
  assert.strictEqual(enI18n['admin-people-filter-all-teams'], 'All Teams');
  // Unchanged neighbour, so this test also catches an insertion at the wrong
  // spot shifting existing keys.
  assert.strictEqual(enI18n['admin-people-filter-inactive'], 'Not Active');
});

test('every non-English, non-en-variant locale has a real (non-English) translation', () => {
  const dataDir = path.join(repoRoot, 'imports/i18n/data');
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.i18n.json'));
  const missing = [];
  for (const file of files) {
    const base = file.replace(/\.i18n\.json$/, '');
    if (base === 'en' || base.startsWith('en_') || base.startsWith('en-')) continue;
    const doc = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
    const team = doc['admin-people-filter-team'];
    const allTeams = doc['admin-people-filter-all-teams'];
    if (!team || !allTeams || team === 'Team:' || allTeams === 'All Teams') {
      missing.push(file);
    }
  }
  assert.deepStrictEqual(missing, [],
    `locales still carrying the English placeholder for the team filter: ${missing.join(', ')}`);
});

test('every locale file is valid JSON with both new keys present', () => {
  const dataDir = path.join(repoRoot, 'imports/i18n/data');
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.i18n.json'));
  for (const file of files) {
    const doc = JSON.parse(fs.readFileSync(path.join(dataDir, file), 'utf8'));
    assert.ok('admin-people-filter-team' in doc, `${file} missing admin-people-filter-team`);
    assert.ok('admin-people-filter-all-teams' in doc, `${file} missing admin-people-filter-all-teams`);
  }
});

console.log(`\npeopleTeamFilter: ${passed} tests passed`);
