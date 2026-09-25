'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('client/components/cards/checklists.js', 'utf8');
const fn = source.slice(source.indexOf('function resolveListDropTarget('), source.indexOf('function initSorting('));
let inChecklist = true;
const list = { _id: 'list', boardId: 'board', swimlaneId: 'lane' };
const empty = { length: 0, get: () => null };
const minicards = { length: 1, get: () => list, closest: () => empty };
const context = {
  window: { scrollX: 0, scrollY: 0 },
  document: { elementFromPoint: () => ({}) },
  $: () => ({ closest: selector => selector === '.js-checklist-items'
    ? { length: inChecklist ? 1 : 0 } : minicards }),
  Blaze: { getData: data => data },
};
vm.createContext(context);
vm.runInContext(fn, context);
assert.equal(context.resolveListDropTarget({ pageX: 20, pageY: 30 }), null,
  'dropping inside a minicard checklist must not create a card in its enclosing list');
inChecklist = false;
assert.equal(context.resolveListDropTarget({ pageX: 20, pageY: 30 }).list._id, 'list',
  'dropping directly on a board list retains card conversion');
assert.equal(context.resolveListDropTarget({}), null);
console.log('minicardChecklistSorting: checklist, bare-list and missing-pointer drop targets pass');
