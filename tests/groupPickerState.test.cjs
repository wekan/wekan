'use strict';

// The board's organization and team pickers (Right sidebar / Members) each
// built the same state in onCreated - error and loading flags, a paged
// subscription, setError/setLoading/isLoading - five copies of 25 lines in
// client/components/sidebar/sidebar.js. They share initGroupPickerState now.
// The publications each picker subscribes to are kept exactly as they were.
//
// Run: node tests/groupPickerState.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', 'client/components/sidebar/sidebar.js'), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const onCreated = name => {
  const at = src.indexOf(`Template.${name}.onCreated(function() {`);
  assert.ok(at !== -1, `${name}.onCreated exists`);
  return src.slice(at, src.indexOf('\n});', at));
};

console.log('groupPickerState:');

test('each picker keeps its publications', () => {
  assert.match(onCreated('membersWidget'), /initGroupPickerState\(this, 'org'\);[\s\S]*this\.subscribe\('team', this\.findTeamsOptions\.get\(\)/);
  assert.match(onCreated('addBoardOrgPopup'), /initGroupPickerState\(this, 'org'\);/);
  for (const name of ['removeBoardOrgPopup', 'addBoardTeamPopup', 'removeBoardTeamPopup']) {
    assert.match(onCreated(name), /initGroupPickerState\(this, 'team', \{ withPeople: true \}\);/, name);
  }
});

test('the helper gives every picker what its events call', () => {
  const at = src.indexOf('function initGroupPickerState(');
  const body = src.slice(at, src.indexOf('\n}\n', at));
  for (const part of ['tpl.error = new ReactiveVar', 'tpl.loading = new ReactiveVar', 'tpl.findOrgsOptions',
    'tpl.page', 'tpl.findUsersOptions', 'tpl.userPage', 'tpl.setError', 'tpl.setLoading', 'tpl.isLoading']) {
    assert.ok(body.includes(part), `initGroupPickerState sets ${part}`);
  }
});

test('no onCreated in the file builds the same state by hand again (negative)', () => {
  // addMemberPopup keeps its own setLoading on purpose: it stores the flag in
  // Session, not in a ReactiveVar of the template.
  const copies = (src.match(/this\.setLoading = function\(w\) \{\s*this\.loading\.set\(w\);/g) || []).length;
  assert.strictEqual(copies, 0, 'use initGroupPickerState instead of another copy');
});

console.log(`\ngroupPickerState: ${passed} tests passed`);
