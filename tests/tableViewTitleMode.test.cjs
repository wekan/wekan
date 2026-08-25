'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const {
  tableViewTitleStorageKey,
  readTableViewTitleWrap,
  writeTableViewTitleWrap,
} = require('../models/lib/tableViewTitleMode');

const values = new Map();
const storage = {
  getItem: key => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, value),
};

assert.strictEqual(readTableViewTitleWrap(storage, 'user-a'), false);
writeTableViewTitleWrap(storage, 'user-a', true);
assert.strictEqual(readTableViewTitleWrap(storage, 'user-a'), true);
assert.strictEqual(readTableViewTitleWrap(storage, 'user-b'), false);
writeTableViewTitleWrap(storage, 'user-a', false);
assert.strictEqual(readTableViewTitleWrap(storage, 'user-a'), false);
assert.notStrictEqual(
  tableViewTitleStorageKey('user-a'),
  tableViewTitleStorageKey('user-b'),
);

const root = path.join(__dirname, '..');
const css = fs.readFileSync(
  path.join(root, 'client/components/boards/tableView.css'),
  'utf8',
);
const jade = fs.readFileSync(
  path.join(root, 'client/components/boards/tableView.jade'),
  'utf8',
);
assert.doesNotMatch(css, /table-view-cell-wrap\s*\{[^}]*max-width:\s*250px/s);
assert.match(css, /table-view-table\s*\{[^}]*width:\s*100%/s);
assert.match(css, /table-view-ellipsis-card-titles[\s\S]*text-overflow:\s*ellipsis/);
assert.match(jade, /table-view-cell-card-title\(title=row\.title\)/);
assert.match(jade, /js-table-view-toggle-card-title-wrap/);

console.log('tableViewTitleMode: 10 checks passed');
