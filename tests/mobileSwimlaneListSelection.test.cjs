'use strict';

// Mobile Mode expands one selected list in its own swimlane without emptying
// every other swimlane on the board.
// Run: node tests/mobileSwimlaneListSelection.test.cjs

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const jade = fs.readFileSync(
  path.join(root, 'client/components/swimlanes/swimlanes.jade'), 'utf8');
const js = fs.readFileSync(
  path.join(root, 'client/components/swimlanes/swimlanes.js'), 'utf8');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

console.log('mobileSwimlaneListSelection:');

test('a selected list expands only in the swimlane it belongs to', () => {
  const mobile = jade.slice(jade.indexOf('template(name="swimlane")'),
    jade.indexOf('template(name="listsGroup")'));
  assert.ok(/if currentListIsInThisSwimlane _id\s*\n\s*\+list\(currentList\)/.test(mobile),
    'the selected swimlane renders the expanded list');
  assert.ok(/unless currentListIsInThisSwimlane _id[\s\S]*each lists[\s\S]*\+miniList\(this\)/
    .test(mobile), 'every other swimlane retains its compact list rows');
});

test('no global current-list guard can empty other swimlanes (negative)', () => {
  const swimlaneTemplate = jade.slice(jade.indexOf('template(name="swimlane")'),
    jade.indexOf('template(name="listsGroup")'));
  assert.ok(!/^\s*unless currentList\s*$/m.test(swimlaneTemplate),
    'the swimlane template must never hide rows merely because some list is selected');
});

test('the membership helper compares the selected list with this swimlane', () => {
  const helper = js.slice(js.indexOf('function currentListIsInThisSwimlane'),
    js.indexOf('function currentCardIsInThisList'));
  assert.ok(/currentList\.swimlaneId === swimlaneId/.test(helper),
    'a swimlane-scoped list matches only its own swimlane');
  assert.ok(/!currentList\.swimlaneId/.test(helper),
    'a board-wide list remains visible in every swimlane');
});

console.log(`\nmobileSwimlaneListSelection: ${passed} tests passed`);
