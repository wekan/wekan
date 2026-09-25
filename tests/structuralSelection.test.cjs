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

// A lane's empty body is a drop target, but not a new swimlane drag handle.
const dragSource = fs.readFileSync('client/components/main/structuralSelection.js', 'utf8');
const entityCode = dragSource.slice(dragSource.indexOf('const entitySelectors'), dragSource.indexOf('Meteor.startup'));
const laneNode = { doc: { _id: 'destination-lane' } };
const listNode = { doc: { _id: 'target-list', swimlaneId: 'destination-lane' } };
const bodyElement = { closest: selector => selector === '.js-swimlane' ? laneNode : null };
const listElement = { closest: selector => selector === '.js-list' ? listNode : selector === '.js-swimlane' ? laneNode : null };
const resolver = vm.runInNewContext(`${entityCode}\n({entityAt,targetFor})`, {
  Blaze: { getData: node => node.doc }, Session: { get: () => 'board' },
});
assert.equal(resolver.entityAt(bodyElement), null);
assert.equal(resolver.entityAt(bodyElement, true).doc._id, 'destination-lane');
assert.equal(resolver.targetFor(resolver.entityAt(bodyElement,true)).swimlaneId, 'destination-lane');
assert.equal(resolver.entityAt(listElement,true).kind, 'list');
assert.equal(resolver.entityAt({closest:()=>null},true), null);
console.log('structuralSelection: empty lane drop, header-only drag start and nested-target precedence passed');

const previewDocument = { createElement(tag) {
  return { tag, children: [], append(...nodes) { this.children.push(...nodes); }, setAttribute() {} };
} };
const buildPreview = vm.runInNewContext(`${entityCode}\ncreateDragPreview;`, {
  document: previewDocument,
  ReactiveCache: {
    getList: id => ({title:id === 'a' ? '<img src=x onerror=alert(1)>' : 'Second list'}),
    getCard: () => ({title:'A selected card'}),
  },
});
const preview = buildPreview([{kind:'list',id:'a'},{kind:'list',id:'b'},{kind:'card',id:'c'}]);
assert.equal(preview.children[0].textContent, '3');
assert.equal(preview.children[1].children[1].textContent, '<img src=x onerror=alert(1)>');
assert.equal(preview.children[1].children[1].tag, 'span');
assert.equal(preview.children[2].children[1].textContent, 'Second list');
assert.equal(preview.children[3].children[1].textContent, 'A selected card');
assert.equal(buildPreview(Array.from({length:10},()=>({kind:'list',id:'b'}))).children.at(-1).textContent, '+2');
console.log('structuralSelection: named mixed preview, literal title text and bounded large selections passed');
