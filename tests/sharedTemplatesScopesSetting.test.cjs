'use strict';
// Admin Panel / People / Shared templates: which group kinds a template board
// may be shared with was read from the browser's localStorage, so it differed
// per browser and was empty for every user but the admin who ticked it - the
// All Boards / Templates "Share template with" targets never showed for them.
// It is the instance setting Settings.sharedTemplatesScopes now.
// Run: node --test tests/sharedTemplatesScopesSetting.test.cjs
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const scopes = require('../models/lib/sharedTemplatesScopes');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

test('the setting is read as known kinds only, each once, in a fixed order', () => {
  assert.deepStrictEqual(scopes.sharedTemplatesScopes({ sharedTemplatesScopes: ['domains', 'teams'] }),
    ['teams', 'domains']);
  assert.deepStrictEqual(scopes.normalizeScopes(['teams', 'teams', 'x', 'organizations']), ['organizations', 'teams']);
  // Negative: nothing stored, or not a list, is no kind at all.
  for (const setting of [undefined, null, {}, { sharedTemplatesScopes: 'teams' }]) {
    assert.deepStrictEqual(scopes.sharedTemplatesScopes(setting), []);
  }
});

test('a tick toggles one kind and leaves the others', () => {
  assert.deepStrictEqual(scopes.toggleScope([], 'teams'), ['teams']);
  assert.deepStrictEqual(scopes.toggleScope(['teams', 'domains'], 'teams'), ['domains']);
  assert.deepStrictEqual(scopes.toggleScope(['domains'], 'organizations'), ['organizations', 'domains']);
  // Negative: an unknown kind changes nothing.
  assert.deepStrictEqual(scopes.toggleScope(['teams'], 'everyone'), ['teams']);
});

test('the schema, the publication and both readers use the setting', () => {
  const schema = read('models/settings.js');
  assert.match(schema, /sharedTemplatesScopes: \{\s*type: Array,\s*optional: true,\s*\},\s*'sharedTemplatesScopes\.\$': \{\s*type: String,\s*allowedValues: \['organizations', 'teams', 'domains'\],/);
  assert.match(read('server/publications/settings.js'), /\n {2}sharedTemplatesScopes: 1,/);
  const boards = read('client/components/boards/boardsList.js');
  assert.match(boards, /sharedTemplatesScopes\(ReactiveCache\.getCurrentSetting\(\)\)/);
  const people = read('client/components/settings/peopleBody.js');
  assert.match(people, /\$set: \{ sharedTemplatesScopes: sharedScopes\.normalizeScopes\(scopes\) \}/);
  assert.match(people, /saveSharedTemplatesScopes\(sharedScopes\.toggleScope\(/);
});

test('negative: no browser storage decides it any more', () => {
  const boards = read('client/components/boards/boardsList.js');
  assert.doesNotMatch(boards, /localStorage\.getItem\('sharedTemplatesScopes'\)/);
  const people = read('client/components/settings/peopleBody.js');
  assert.doesNotMatch(people, /localStorage\.setItem\([^)]*SHARED_TEMPLATES|localStorage\.setItem\('sharedTemplatesScopes'/);
  // The old key is only read once, to carry an admin's ticks over, then removed -
  // and only when the instance has no setting of its own yet.
  const carry = people.slice(people.indexOf('function carryOverLegacyScopes()'),
    people.indexOf('Template.templatesGeneral.onCreated'));
  assert.match(carry, /localStorage\.removeItem\(sharedScopes\.LEGACY_STORAGE_KEY\)/);
  assert.match(carry, /setting\.sharedTemplatesScopes === undefined/);
});
