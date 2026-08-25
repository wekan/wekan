'use strict';

const assert = require('assert');
const {
  compareTableViewRows,
  nextTableViewSort,
} = require('../models/lib/tableViewSort');

const rows = [
  { title: 'Card 10', listTitle: 'Beta', dueAt: null },
  { title: 'Card 2', listTitle: 'Alpha', dueAt: new Date('2026-09-02') },
  { title: 'Card 1', listTitle: 'Alpha', dueAt: new Date('2026-09-01') },
];
const sorted = (field, direction) =>
  rows.slice().sort((a, b) => compareTableViewRows(a, b, field, direction));

assert.deepStrictEqual(sorted('title', 'asc').map(row => row.title), [
  'Card 1',
  'Card 2',
  'Card 10',
]);
assert.deepStrictEqual(sorted('title', 'desc').map(row => row.title), [
  'Card 10',
  'Card 2',
  'Card 1',
]);
assert.deepStrictEqual(sorted('listTitle', 'asc').map(row => row.title), [
  'Card 1',
  'Card 2',
  'Card 10',
]);
assert.deepStrictEqual(sorted('dueAt', 'desc').map(row => row.title), [
  'Card 2',
  'Card 1',
  'Card 10',
]);
assert.deepStrictEqual(nextTableViewSort('title', 'asc', 'title'), {
  field: 'title',
  direction: 'desc',
});
assert.deepStrictEqual(nextTableViewSort('title', 'desc', 'dueAt'), {
  field: 'dueAt',
  direction: 'asc',
});

console.log('tableViewSort: 6 checks passed');
