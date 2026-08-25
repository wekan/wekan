'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  tableViewGroupingStorageKey,
  readTableViewGrouping,
  writeTableViewGrouping,
  addSwimlaneGroupHeaders,
} = require('../models/lib/tableViewGrouping');

const values = new Map();
const storage = {
  getItem: key => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value),
};
assert.strictEqual(readTableViewGrouping(storage, 'a'), false);
writeTableViewGrouping(storage, 'a', true);
assert.strictEqual(readTableViewGrouping(storage, 'a'), true);
assert.strictEqual(readTableViewGrouping(storage, 'b'), false);
assert.notStrictEqual(tableViewGroupingStorageKey('a'), tableViewGroupingStorageKey('b'));

const rows = [
  { title: 'A', swimlaneId: 'one', swimlaneTitle: 'One' },
  { title: 'B', swimlaneId: 'one', swimlaneTitle: 'One' },
  { title: 'C', swimlaneId: 'two', swimlaneTitle: 'Two' },
];
const grouped = addSwimlaneGroupHeaders(rows);
assert.deepStrictEqual(
  grouped.map(row => row.isGroupHeader ? `header:${row.swimlaneTitle}` : row.title),
  ['header:One', 'A', 'B', 'header:Two', 'C'],
);
assert.deepStrictEqual(addSwimlaneGroupHeaders([]), []);

const root = path.join(__dirname, '..');
const jade = fs.readFileSync(
  path.join(root, 'client/components/boards/tableView.jade'),
  'utf8',
);
const js = fs.readFileSync(
  path.join(root, 'client/components/boards/tableView.js'),
  'utf8',
);
assert.match(jade, /tr\.table-view-swimlane-group/);
assert.match(jade, /js-table-view-toggle-swimlane-groups/);
assert.match(js, /addSwimlaneGroupHeaders\(pageRows\)/);
assert.match(js, /tpl\.page\.set\(1\)/);

console.log('tableViewGrouping: 10 checks passed');
