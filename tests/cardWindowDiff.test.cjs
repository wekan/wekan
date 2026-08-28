'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');

global.EJSON = {
  equals(left, right) {
    return JSON.stringify(left) === JSON.stringify(right);
  },
};

const { diffCardWindow } = require('../models/lib/cardWindowDiff');

test('a refreshed card window reports additions, edits and moves out', () => {
  const before = [
    { _id: 'stay', title: 'Old title', listId: 'list-a', sort: 1 },
    { _id: 'move', title: 'Moving', listId: 'list-a', sort: 2 },
  ];
  const after = [
    { _id: 'new', title: 'Moved in', listId: 'list-a', sort: 1 },
    { _id: 'stay', title: 'New title', listId: 'list-a', sort: 2 },
  ];

  assert.deepEqual(diffCardWindow(before, after), {
    added: [after[0]],
    changed: [{ _id: 'stay', fields: { title: 'New title', sort: 2 } }],
    removed: ['move'],
  });
});

test('unchanged cards produce no DDP messages', () => {
  const card = { _id: 'same', title: 'Same', labels: ['one'] };
  assert.deepEqual(diffCardWindow([card], [{ ...card, labels: ['one'] }]), {
    added: [], changed: [], removed: [],
  });
});

test('removed fields are explicitly cleared on the client', () => {
  const diff = diffCardWindow(
    [{ _id: 'card', title: 'Card', optional: 'old' }],
    [{ _id: 'card', title: 'Card' }],
  );
  assert.equal(diff.changed.length, 1);
  assert.equal(Object.hasOwn(diff.changed[0].fields, 'optional'), true);
  assert.equal(diff.changed[0].fields.optional, undefined);
});
