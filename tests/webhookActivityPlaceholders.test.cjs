'use strict';

// Regression coverage for #1969 / #2226. Activity webhooks once emitted raw
// translation keys and tokens such as act-addedLabel, __member__, and
// __checklistItem__. The activity builder must resolve every entity before the
// complete parameter object reaches TAPi18n.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const activities = read('server/models/activities.js');
const outgoing = read('server/notifications/outgoing.js');
const en = JSON.parse(read('imports/i18n/data/en.i18n.json'));
const de = JSON.parse(read('imports/i18n/data/de.i18n.json'));

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

function tokens(value) {
  return [...String(value).matchAll(/__[A-Za-z0-9_]+__/g)].map(match => match[0]).sort();
}

test('the activity builder resolves every entity reported missing', () => {
  for (const assignment of [
    'params.member =',
    'params.checklistItem =',
    'params.checklist =',
    'params.card =',
    'params.list =',
    'params.swimlane =',
    'params.board =',
    'params.oldList =',
    'params.oldSwimlane =',
    'params.oldBoard =',
    'params.label =',
  ]) {
    assert.ok(activities.includes(assignment), `${assignment} must be populated`);
  }
});

test('webhook translation starts from all resolved parameters', () => {
  assert.match(outgoing, /const quoteParams = \{ \.\.\.params \}/);
  assert.match(outgoing, /TAPi18n\.__\(\s*description,\s*quoteParams,\s*user\.getLanguage\(\)/);
  assert.doesNotMatch(outgoing, /TAPi18n\.__\(description,\s*\{\s*\}/,
    'never translate an activity without its replacement values');
});

test('German translates the reported activities and preserves their tokens', () => {
  for (const key of ['act-addedLabel', 'act-addBoardMember', 'act-checkedItem']) {
    assert.notStrictEqual(de[key], en[key], `${key} must not fall back to English`);
    assert.notStrictEqual(de[key], key, `${key} must not render as the raw key`);
    assert.deepStrictEqual(tokens(de[key]), tokens(en[key]),
      `${key} must retain exactly the replaceable token inventory`);
  }
});

console.log(`\nwebhookActivityPlaceholders: ${passed} tests passed`);
