'use strict';
// #2076: rule triggers "a card is moved forward / back" - to a later or
// earlier list in the board's list order - so one rule can put a card at the
// bottom when it moves on and at the top when it moves back.
//
// Run: node tests/ruleMoveDirection.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { moveDirection, directionTriggerMatches } = require('../models/lib/ruleMoveDirection');

const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }
console.log('ruleMoveDirection:');

const todo = { _id: 'todo', boardId: 'b', sort: 0 };
const doing = { _id: 'doing', boardId: 'b', sort: 1 };
const done = { _id: 'done', boardId: 'b', sort: 2.5 };

test('a later list is forward, an earlier one back, skipping lists counts too', () => {
  assert.equal(moveDirection(todo, doing), 'forward');
  assert.equal(moveDirection(todo, done), 'forward');
  assert.equal(moveDirection(done, todo), 'back');
});

test('negative: the same list, another board, missing lists or equal positions have no direction', () => {
  assert.equal(moveDirection(todo, todo), null);
  assert.equal(moveDirection(todo, { _id: 'x', boardId: 'other', sort: 5 }), null);
  assert.equal(moveDirection(null, doing), null);
  assert.equal(moveDirection(todo, { _id: 'tie', boardId: 'b', sort: 0 }), null);
  assert.equal(moveDirection(todo, { _id: 'nan', boardId: 'b', sort: 'x' }), null);
});

test('a trigger fires only for its own direction', () => {
  assert.equal(directionTriggerMatches({ direction: 'forward' }, 'forward'), true);
  assert.equal(directionTriggerMatches({ direction: 'forward' }, 'back'), false);
  assert.equal(directionTriggerMatches({ direction: 'sideways' }, 'sideways'), false);
  assert.equal(directionTriggerMatches({ direction: 'back' }, null), false);
});

test('matched on moveCard activities between two lists, on the rule\'s own board', () => {
  const helper = read('server/rulesHelper.js');
  const block = helper.slice(helper.indexOf("// #2076: \"a card is moved forward / back\""), helper.indexOf('// #2194: "card title/description contains {value}" trigger.'));
  assert.match(block, /activityType === 'moveCard' && activity\.boardId && activity\.oldListId && activity\.listId &&\s*activity\.oldListId !== activity\.listId/);
  assert.match(block, /boardId: activity\.boardId,\s*activityType: 'moveCardDirection',/);
  assert.match(block, /await ruleOnBoard\(trigger, activity\.boardId\)/);
  const ui = read('client/components/rules/triggers/boardTriggers.js');
  assert.match(ui, /activityType: 'moveCardDirection',[\s\S]*?direction,/);
  assert.match(read('server/triggersDef.js'), /'moveCardDirection'/);
});

console.log(`\nruleMoveDirection: ${passed} tests passed`);
