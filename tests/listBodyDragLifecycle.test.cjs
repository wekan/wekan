'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { changedSortableOptions } = require('../models/lib/sortableOptions.js');
const source = fs.readFileSync('client/components/lists/list.js', 'utf8');
const template = fs.readFileSync('client/components/lists/list.jade', 'utf8');

assert.match(template, /unless collapsed\s+\+listBody/);
const start = source.indexOf('Template.listBody.onRendered(function () {');
assert.ok(start >= 0, '#6705: card drag widgets must follow the replaceable listBody, not the surviving list');
const end = source.indexOf('// A board-wide list', start);
let render;
let destroy;
const queued = [];
let writable = true;
let handles = false;
// 7950979cb added per-board draggable settings: the card sortable is disabled
// when the user cannot modify the board OR the board has turned card dragging
// off (Utils.canDragBoardObject('card')). The stub grew that helper; both
// switches are asserted below so neither can be dropped from the autorun.
let cardDragAllowed = true;
const draggedKinds = [];
vm.runInNewContext(source.slice(start, end), {
  Template: { listBody: { onRendered(fn) { render = fn; }, onDestroyed(fn) { destroy = fn; } } },
  document: { querySelector: () => null },
  Blaze: { getView: () => null },
  Utils: {
    canModifyBoard: () => writable,
    canDragBoardObject: kind => { draggedKinds.push(kind); return cardDragAllowed; },
    isTouchScreenOrShowDesktopDragHandles: () => handles,
  },
  Tracker: { nonreactive: fn => fn(), afterFlush: fn => queued.push(fn) },
  Session: { get: () => 'board' },
  ReactiveCache: { getCards: () => [] },
  // #6745: client/lib/sortableOptions.js, the same two lines.
  setSortableOptions($el, wanted) {
    const changes = changedSortableOptions(key => $el.sortable('option', key), wanted);
    if (Object.keys(changes).length > 0) $el.sortable('option', changes);
  },
});
function body() {
  const state = { widget: null, options: {}, drops: 0, destroys: 0, runs: [], optionWrites: 0 };
  const cards = {
    data: () => state.widget,
    sortable(command, name, value) {
      if (typeof command === 'object') { state.widget = command; Object.assign(state.options, command); }
      if (command === 'option' && typeof name === 'string' && arguments.length === 2) return state.options[name];
      if (command === 'option' && typeof name === 'object') { Object.assign(state.options, name); state.optionWrites++; }
      else if (command === 'option') { state.options[name] = value; state.optionWrites++; }
      if (command === 'destroy') { state.widget = null; state.destroys++; }
      return undefined;
    },
    find: () => ({ droppable: () => { state.drops++; } }),
  };
  const instance = { $: () => cards, autorun(fn) { state.runs.push(fn); fn(); } };
  render.call(instance);
  return { state, instance };
}
const first = body();
assert.ok(first.state.widget);
assert.equal(first.state.options.disabled, false);
assert.equal(first.state.options.handle, '.minicard');
// #6745: an autorun re-run with nothing changed writes no option - re-setting
// `handle` made jQuery UI re-tag every card of the list.
const writesBefore = first.state.optionWrites;
first.state.runs[0]();
assert.equal(first.state.optionWrites, writesBefore, 'an unchanged option is not set again');
handles = true;
first.state.runs[0]();
assert.equal(first.state.options.handle, '.handle');
destroy.call(first.instance);
while (queued.length) queued.shift()();
assert.equal(first.state.drops, 0, 'a queued drop initializer must not touch a collapsed body');
assert.equal(first.state.destroys, 1);
const expanded = body();
assert.ok(expanded.state.widget, 'expanding creates a working sortable on the replacement body');
while (queued.length) queued.shift()();
assert.equal(expanded.state.drops, 1);
assert.ok(draggedKinds.includes('card'), 'the list body asks whether CARDS may be dragged on this board');
cardDragAllowed = false;
expanded.state.runs[0]();
assert.equal(expanded.state.options.disabled, true, 'a board that turned card dragging off disables the sortable (negative)');
cardDragAllowed = true;
expanded.state.runs[0]();
assert.equal(expanded.state.options.disabled, false, 'and turning it back on re-enables it');
writable = false;
expanded.state.runs[0]();
assert.equal(expanded.state.options.disabled, true, 'read-only users remain unable to drag after expansion');
destroy.call(expanded.instance);
assert.equal(expanded.state.destroys, 1);
console.log('  ok - #6705 body replacement restores drag widgets, preserves permissions and stops deferred work');
