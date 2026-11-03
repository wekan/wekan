'use strict';

// #6865: "when you create a list via the button on other lists, after creation
// pressing Esc doesn't close the dialog". The inline add-list composer (#6465)
// stays open after a list is created, so several can be added, and only its X
// closed it. Escape closes it too, at the level of an inlined form.
//
// Run: node tests/addListEscape6865.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const source = fs.readFileSync(path.join(__dirname, '../client/components/swimlanes/swimlanes.js'), 'utf8');
const at = source.indexOf('// Close the inline add-list composer');
const piece = source.slice(at, source.indexOf('\n);', at) + 3);

function run() {
  const session = new Map();
  const registered = [];
  const context = {
    Session: { set: (k, v) => session.set(k, v), get: k => (session.has(k) ? session.get(k) : undefined) },
    EscapeActions: { register: (...args) => registered.push(args) },
  };
  vm.runInNewContext(piece, context);
  assert.equal(registered.length, 1, 'registered once');
  const [label, action, condition, options] = registered[0];
  return { session, label, action, condition, options, close: () => vm.runInNewContext('closeAddListComposer()', context) };
}

test('Escape is registered at the inlined-form level, and not for a click elsewhere', () => {
  const { label, options } = run();
  assert.equal(label, 'inlinedForm');
  assert.equal(options.enabledOnClick, false);
});

test('it applies while the composer is open after a list, or open in an empty swimlane, and not otherwise', () => {
  const state = run();
  assert.equal(state.condition(), false, 'closed');
  state.session.set('wekan-add-list-after', 'listA');
  assert.equal(state.condition(), true, 'open after a list');
  state.session.set('wekan-add-list-after', null);
  state.session.set('wekan-add-list-empty', 'swimlaneA');
  assert.equal(state.condition(), true, 'open in an empty swimlane');
});

test('Escape closes it, with everything the X resets, and then it no longer applies', () => {
  const state = run();
  state.session.set('wekan-add-list-after', 'listA');
  state.session.set('wekan-add-list-swimlane', 'swimlaneA');
  state.session.set('wekan-add-list-empty', 'swimlaneA');
  state.action();
  for (const key of ['wekan-add-list-after', 'wekan-add-list-swimlane', 'wekan-add-list-empty']) assert.equal(state.session.get(key), null, key);
  assert.equal(state.condition(), false);
});

test('the X and Escape are one function, and the swimlane-less Lists view uses the same composer', () => {
  assert.match(source, /'click \.js-close-add-list-inline'\(\) \{\s+closeAddListComposer\(\);/);
  assert.equal((source.match(/'wekan-add-list-after', null\)/g) || []).length >= 2, true);
  assert.match(source, /Template\.listsGroup\.helpers/, 'one composer, two views');
});

test('negative: the composer is not an inlined form of the inlinedform.js kind, so nothing else closes it', () => {
  const jade = fs.readFileSync(path.join(__dirname, '../client/components/swimlanes/swimlanes.jade'), 'utf8');
  assert.doesNotMatch(jade.slice(jade.indexOf('addListInline')), /js-open-inlined-form/);
});
