'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
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
vm.runInNewContext(source.slice(start, end), {
  Template: { listBody: { onRendered(fn) { render = fn; }, onDestroyed(fn) { destroy = fn; } } },
  document: { querySelector: () => null },
  Blaze: { getView: () => null },
  Utils: { canModifyBoard: () => writable, isTouchScreenOrShowDesktopDragHandles: () => handles },
  Tracker: { nonreactive: fn => fn(), afterFlush: fn => queued.push(fn) },
  Session: { get: () => 'board' },
  ReactiveCache: { getCards: () => [] },
});
function body() {
  const state = { widget: null, options: {}, drops: 0, destroys: 0, runs: [] };
  const cards = {
    data: () => state.widget,
    sortable(command, name, value) {
      if (typeof command === 'object') state.widget = command;
      if (command === 'option') state.options[name] = value;
      if (command === 'destroy') { state.widget = null; state.destroys++; }
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
writable = false;
expanded.state.runs[0]();
assert.equal(expanded.state.options.disabled, true, 'read-only users remain unable to drag after expansion');
destroy.call(expanded.instance);
assert.equal(expanded.state.destroys, 1);
console.log('  ok - #6705 body replacement restores drag widgets, preserves permissions and stops deferred work');
