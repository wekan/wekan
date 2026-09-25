'use strict';
const assert = require('node:assert/strict');
const { selectionRoots } = require('../models/lib/structuralSelection');
const entries = [
 { kind: 'swimlane', _id: 'lane', ancestors: [] },
 { kind: 'list', _id: 'list', ancestors: ['swimlane:lane'] },
 { kind: 'card', _id: 'card', ancestors: ['list:list', 'swimlane:lane'] },
 { kind: 'checklist', _id: 'check', ancestors: ['card:card', 'list:list', 'swimlane:lane'] },
 { kind: 'item', _id: 'item', ancestors: ['checklist:check', 'card:card', 'list:list', 'swimlane:lane'] },
];
assert.deepEqual(selectionRoots(entries).map(e => e._id), ['lane']);
assert.deepEqual(selectionRoots(entries.slice(1)).map(e => e._id), ['list']);
assert.deepEqual(selectionRoots(entries.slice(2)).map(e => e._id), ['card']);
assert.deepEqual(selectionRoots(entries.slice(3)).map(e => e._id), ['check']);
assert.deepEqual(selectionRoots([entries[4], entries[4]]).map(e => e._id), ['item']);
assert.equal(selectionRoots([{ ...entries[0], _id: 'other' }, entries[4]]).length, 2);
console.log('structuralSelection: mixed roots, ancestor suppression and duplicates passed');
// Exercise client state without Meteor: structural selections stay board-scoped,
// and Shift-selecting cards must not discard already selected checklists.
const fs = require('node:fs');
const vm = require('node:vm');
let currentBoard = 'board';
class ReactiveVar { constructor(value) { this.value = value; } get() { return this.value; } set(value) { this.value = value; } }
const source = fs.readFileSync('client/lib/multiSelection.js', 'utf8')
  .replace(/import[\s\S]*?from\s+['"][^'"]+['"];\n/g, '')
  .replace('export const MultiSelection', 'const MultiSelection');
const state = vm.runInNewContext(`${source}\nMultiSelection;`, {
  ReactiveVar, Session: { get: () => currentBoard },
  ReactiveCache: { getCards: () => [], getCard: () => ({ boardId: currentBoard }) },
  Filter: { mongoSelector: value => value },
  cardIdsOnBoard: ids => ids,
  boardScopedSelectionSelector: () => ({}),
  Blaze: { registerHelper() {} }, EscapeActions: { register() {} },
});
state._isActive.set(true);
state.toggleObject('checklist', 'check', 'board');
assert.equal(state.isObjectSelected('checklist', 'check'), true);
state.toggleRange('card');
assert.equal(state.isObjectSelected('checklist', 'check'), true);
assert.equal(state.isSelected('card'), true);
currentBoard = 'other';
assert.equal(state.hasObjects(), false);
currentBoard = 'board';
state.toggleObject('checklist', 'check', 'board');
assert.equal(state.hasObjects(), false);
state.reset();
assert.equal(state.isSelected('card'), false);
console.log('structuralSelection: board scoping, mixed Shift selection, toggle and reset passed');
