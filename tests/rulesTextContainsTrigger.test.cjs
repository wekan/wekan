'use strict';

// Regression coverage for issue #2194 ("Card title/description contains
// {value}"). WeKan's rules are single-trigger/single-condition today (the
// #4294 investigation explicitly deferred combining several conditions in
// one rule with AND - see CHANGELOG.md's TODO Later). This adds ONE new
// trigger type, "when a card's title or description contains {value}",
// following the same "store what the user typed client-side, match it
// server-side against the card's CURRENT state" split the #3092 advanced-
// filter trigger already uses (it is not a simple TriggersDef exact/wildcard
// match either): server/rulesHelper.js re-reads the card on
// createCard/a-changedTitle/a-changedDescription and does a case-insensitive
// substring test (models/lib/ruleTextContainsMatch.js).

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(repoRoot, rel), 'utf8');

const { textContainsMatch, cardTextContainsMatch } = require(
  path.join(repoRoot, 'models/lib/ruleTextContainsMatch.js'),
);

const triggersDefSrc = read('server/triggersDef.js');
const rulesHelperSrc = read('server/rulesHelper.js');
const cardTriggersJadeSrc = read('client/components/rules/triggers/cardTriggers.jade');
const cardTriggersJsSrc = read('client/components/rules/triggers/cardTriggers.js');
const enI18n = JSON.parse(read('imports/i18n/data/en.i18n.json'));

let passed = 0;
const tests = [];
function test(name, fn) { tests.push([name, fn]); }

// --- pure decision function: textContainsMatch / cardTextContainsMatch -----

test('textContainsMatch: matches a substring, case-insensitively', () => {
  assert.strictEqual(textContainsMatch('Please apply a Patch here', 'patch'), true);
  assert.strictEqual(textContainsMatch('PATCH release', 'Patch'), true);
  assert.strictEqual(textContainsMatch('patch', 'PATCH'), true);
});

test('textContainsMatch: negative - unrelated text does not match', () => {
  assert.strictEqual(textContainsMatch('Fix the login bug', 'patch'), false);
  assert.strictEqual(textContainsMatch('', 'patch'), false);
});

test('textContainsMatch: negative - an empty/missing needle never matches', () => {
  assert.strictEqual(textContainsMatch('Patch release notes', ''), false);
  assert.strictEqual(textContainsMatch('Patch release notes', '   '), false);
  assert.strictEqual(textContainsMatch('Patch release notes', undefined), false);
  assert.strictEqual(textContainsMatch('Patch release notes', null), false);
});

test('textContainsMatch: negative - a non-string/missing haystack never matches', () => {
  assert.strictEqual(textContainsMatch(undefined, 'patch'), false);
  assert.strictEqual(textContainsMatch(null, 'patch'), false);
});

test('cardTextContainsMatch: matches the card TITLE', () => {
  const card = { title: 'Backlog: needs a Patch', description: 'unrelated' };
  assert.strictEqual(cardTextContainsMatch(card, 'patch'), true);
});

test('cardTextContainsMatch: matches the card DESCRIPTION when the title does not match', () => {
  const card = { title: 'Unrelated title', description: 'This needs a PATCH applied.' };
  assert.strictEqual(cardTextContainsMatch(card, 'patch'), true);
});

test('cardTextContainsMatch: negative - neither title nor description contains the needle', () => {
  const card = { title: 'Unrelated title', description: 'Also unrelated' };
  assert.strictEqual(cardTextContainsMatch(card, 'patch'), false);
});

test('cardTextContainsMatch: negative - no card, no crash', () => {
  assert.strictEqual(cardTextContainsMatch(null, 'patch'), false);
  assert.strictEqual(cardTextContainsMatch(undefined, 'patch'), false);
});

test('cardTextContainsMatch: negative - a card with no description does not crash', () => {
  const card = { title: 'Nothing here' };
  assert.strictEqual(cardTextContainsMatch(card, 'patch'), false);
});

// --- server/triggersDef.js documents the new trigger kind -------------------

test('triggersDef.js documents textContainsTrigger alongside advancedFilterTrigger (both bypass TriggersDef matching)', () => {
  assert.ok(/textContainsTrigger/.test(triggersDefSrc));
  assert.ok(!/^\s*textContainsTrigger:\s*\{/m.test(triggersDefSrc),
    'textContainsTrigger must NOT be a TriggersDef matchingFields entry - it is matched directly in rulesHelper.js, like advancedFilterTrigger');
});

// --- server/rulesHelper.js wires the trigger up ------------------------------

test('rulesHelper.js imports and uses cardTextContainsMatch', () => {
  assert.ok(/from '\/models\/lib\/ruleTextContainsMatch'/.test(rulesHelperSrc));
  assert.ok(/cardTextContainsMatch\(/.test(rulesHelperSrc));
});

test("rulesHelper.js queries triggers with activityType: 'textContainsTrigger'", () => {
  assert.ok(/activityType: 'textContainsTrigger'/.test(rulesHelperSrc));
});

test('rulesHelper.js reacts to createCard, a-changedTitle and a-changedDescription - not every activity', () => {
  const block = rulesHelperSrc.slice(rulesHelperSrc.indexOf('textContainsActivityTypes'));
  const body = block.slice(0, block.indexOf(']') + 1);
  assert.ok(/createCard/.test(body));
  assert.ok(/a-changedTitle/.test(body));
  assert.ok(/a-changedDescription/.test(body));
});

// --- client/components/rules/triggers/cardTriggers.js|.jade -----------------

test('cardTriggers.js registers the click handler that stores the trigger', () => {
  assert.ok(/'click \.js-add-text-contains-trigger'/.test(cardTriggersJsSrc));
  assert.ok(/activityType: 'textContainsTrigger'/.test(cardTriggersJsSrc));
  assert.ok(/textContains/.test(cardTriggersJsSrc));
});

test('cardTriggers.jade has the trigger-item wired to the click handler and a text input', () => {
  assert.ok(/js-add-text-contains-trigger/.test(cardTriggersJadeSrc));
  assert.ok(/text-contains-trigger-value/.test(cardTriggersJadeSrc));
});

test('negative: the new trigger button is not the same class as the advanced-filter trigger button', () => {
  assert.notStrictEqual('js-add-text-contains-trigger', 'js-add-advanced-filter-trigger');
});

// --- i18n --------------------------------------------------------------------

test('en.i18n.json has the new trigger label/description keys, non-empty', () => {
  ['text-contains-trigger-label', 'text-contains-trigger-description', 'r-when-a-card-title-or-description-contains']
    .forEach(k => {
      assert.ok(typeof enI18n[k] === 'string' && enI18n[k].length > 0, `${k} is present`);
    });
});

// --- run ----------------------------------------------------------------------

tests.forEach(([name, fn]) => {
  try {
    fn();
    console.log(`  ok - ${name}`);
    passed++;
  } catch (e) {
    console.log(`  FAIL - ${name}`);
    console.log(`    ${e.message}`);
  }
});

console.log(`\nrulesTextContainsTrigger: ${passed}/${tests.length} passed`);
if (passed !== tests.length) process.exit(1);
