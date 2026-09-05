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
const listHeaderJade = fs.readFileSync(
  path.join(root, 'client/components/lists/listHeader.jade'), 'utf8');
const listHeaderJs = fs.readFileSync(
  path.join(root, 'client/components/lists/listHeader.js'), 'utf8');
const mainHeaderJade = fs.readFileSync(
  path.join(root, 'client/components/main/header.jade'), 'utf8');

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

test('compact rows keep their header layout when another list is selected', () => {
  assert.strictEqual((listHeaderJade.match(/if isCurrentList/g) || []).length, 2,
    'both mobile header branches must use list-scoped selection state');
  assert.ok(!/^\s*if currentList\s*$/m.test(listHeaderJade),
    'a global selected-list check must not resize unrelated compact rows');
  assert.ok(/isCurrentList\(\)[\s\S]*Utils\.getCurrentListId\(\) === list\._id/
    .test(listHeaderJs), 'the header state must match the selected list ID');
});

test('selecting a mobile list does not add list names to the top header', () => {
  assert.ok(!/if currentList\s*\n\s*ul\.header-quick-access-list/.test(mainHeaderJade),
    'the quick-access header must not render board list names on selection');
});

console.log(`\nmobileSwimlaneListSelection: ${passed} tests passed`);
