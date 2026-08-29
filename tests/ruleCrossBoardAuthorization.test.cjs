'use strict';

// RuleBleed / GHSA-9w4x-hf2r-hc9v: automation actions run server-side and do
// not invoke Mongo collection allow/deny callbacks. Pin authorization at both
// rule registration and execution, including legacy actions already in data.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');
const button = read('server/rulesButton.js');
const helper = read('server/rulesHelper.js');
const rest = read('server/models/rules.js');
const playwrightDb = read('tests/playwright/helpers/db.js');

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log('  ok -', name);
}

test('rule creation checks a different destination before inserting any document', () => {
  const guard = button.indexOf('if (actionDoc.boardId !== boardId)');
  const triggerInsert = button.indexOf('Triggers.insertAsync(', guard);
  const insert = button.indexOf('Actions.insertAsync(actionDoc)');
  assert.ok(guard > 0 && guard < triggerInsert && triggerInsert < insert);
  assert.match(
    button.slice(guard, insert),
    /allowIsBoardMemberWithWriteAccess\(this\.userId, destination\)/,
  );
});

test('negative: denied rule creation is attributed and throws before insertion', () => {
  const guard = button.match(
    /if \(actionDoc\.boardId !== boardId\) \{[\s\S]*?\n    \}/,
  );
  assert.ok(guard);
  assert.match(guard[0], /tripCanary\('rule\.cross-board-write'/);
  assert.match(guard[0], /throw new Meteor\.Error\(\s*'not-authorized'/);
});

test('legacy cross-board actions are checked before destination lookups', () => {
  const gate = helper.indexOf('if (crossBoardActions.includes(action.actionType)');
  const firstListLookup = helper.indexOf('ReactiveCache.getList(', gate);
  assert.ok(gate > 0 && gate < firstListLookup);
  assert.match(
    helper.slice(gate, firstListLookup),
    /allowIsBoardMemberWithWriteAccess\(activity\.userId, destination\)/,
  );
});

test('move, link and bulk-move actions all use the execution gate', () => {
  for (const type of [
    'moveCardToTop',
    'moveCardToBottom',
    'linkCard',
    'moveAllCardsInList',
  ]) {
    assert.match(helper, new RegExp(`'${type}'`), `${type} must be gated`);
  }
});

test('negative: REST creation and editing cannot retain a supplied destination', () => {
  assert.match(rest, /const STRIP = \['_id', 'boardId'/);
  assert.match(rest, /Actions\.insertAsync\(\{ \.\.\.strip\(action\), boardId: paramBoardId \}\)/);
  assert.match(rest, /\$set: \{ \.\.\.strip\(req\.body\.action\), boardId: paramBoardId \}/);
});

test('browser fixtures remove rule documents for each discarded board', () => {
  const cleanup = playwrightDb.match(/function cleanup\([\s\S]*?\n\}/);
  assert.ok(cleanup);
  for (const collection of ['rules', 'triggers', 'actions']) {
    assert.match(
      cleanup[0],
      new RegExp(`collection: '${collection}'.*filter: \\{ boardId \\}`),
      `${collection} must not leak into later browser tests`,
    );
  }
});

console.log(`\n${passed} tests passed`);
