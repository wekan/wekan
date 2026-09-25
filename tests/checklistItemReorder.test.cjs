'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('client/components/cards/checklists.js', 'utf8');
const init = source.slice(source.indexOf('function initSorting('), source.indexOf('Template.checklistSortableItems.onRendered'));
function drop({ destination = 'source', prev = null, next = null, list = false } = {}) {
  let handler, cancelled = false, moved, inserted;
  const original = { checklist: { _id: 'source' } };
  const target = { checklist: { _id: destination } };
  const item = { title: 'Task', move(id, sort) { assert.ok(cancelled); moved = { id, sort }; } };
  const get = data => ({ get: () => data });
  const node = { item };
  const ui = { item: {
    get: () => node,
    parents: () => ({ ...get(cancelled ? original : target), find: () => {
      const nodes = cancelled ? [node, { item: { sort: 1 } }]
        : [...(prev ? [{ item: prev }] : []), node, ...(next ? [{ item: next }] : [])];
      return { length: nodes.length, get: i => nodes[i], index: n => nodes.indexOf(n) };
    } }),
    prev: () => get(undefined), // wrapper, not a direct sibling row
    next: () => get(undefined),
  } };
  const items = { sortable(arg) { if (arg === 'cancel') cancelled = true; else handler = arg.stop; } };
  vm.runInNewContext(init + '\ninitSorting(items);', {
    items, Blaze: { getData: node => node },
    resolveListDropTarget: () => list ? { list: { _id: 'list' }, swimlaneId: 'swimlane' } : null,
    ReactiveCache: { getCards: () => [] },
    buildCardFromChecklistItem: () => ({ title: 'Task' }),
    Cards: { insert: doc => { inserted = doc; } },
    calculateIndexData: (p, n) => ({ base: p ? n ? (p.sort + n.sort) / 2 : p.sort + 1 : n ? n.sort - 1 : 0 }),
  });
  handler({}, ui);
  return { moved, inserted, cancelled };
}
assert.deepEqual(drop({ prev: { sort: 2 }, next: { sort: 4 } }).moved, { id: 'source', sort: 3 });
assert.deepEqual(drop({ next: { sort: 0 } }).moved, { id: 'source', sort: -1 });
assert.deepEqual(drop({ prev: { sort: 4 } }).moved, { id: 'source', sort: 5 });
assert.deepEqual(drop({ destination: 'other' }).moved, { id: 'other', sort: 0 });
const cardDrop = drop({ list: true });
assert.equal(cardDrop.moved, undefined);
assert.ok(cardDrop.inserted);
assert.ok(cardDrop.cancelled);
console.log('checklistItemReorder: middle, first, last, cross-checklist and card-drop cases passed');
