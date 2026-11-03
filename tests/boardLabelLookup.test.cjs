'use strict';

// #6864: a board label is looked up by name and color before one is added, and the
// lookup compared the name as it was sent while the schema stores it trimmed. A
// padded " Bug " missed the stored "Bug", and every repeat of the request created
// another label with the same name and color. The REST route sent the name through
// buildBoardLabel, but the same lookup serves the card's label form, the importers
// and the list sync, so it is the lookup that trims, and so does the REST builder.
//
// Run: node tests/boardLabelLookup.test.cjs

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const { buildBoardLabel } = require('../models/lib/restLabel.js');

const COLORS = ['green', 'red', 'blue'];
const source = fs.readFileSync(path.join(__dirname, '../models/boards.js'), 'utf8');
const start = source.indexOf('  getLabel(name, color) {');
const getLabel = vm.runInNewContext(`(function ${source.slice(start + 2, source.indexOf('\n  },', start) + 4)})`);

const board = labels => ({ labels, getLabel });

test('a padded name finds the stored trimmed label, whatever the padding', () => {
  const b = board([{ _id: 'a', name: 'Bug', color: 'red' }]);
  for (const name of ['Bug', ' Bug ', '\tBug\n', ' Bug ']) assert.equal(b.getLabel(name, 'red')._id, 'a', JSON.stringify(name));
});

test('a legacy label stored with padding is found by its trimmed name, and by its padded one', () => {
  const b = board([{ _id: 'old', name: ' Bug ', color: 'red' }]);
  assert.equal(b.getLabel('Bug', 'red')._id, 'old');
  assert.equal(b.getLabel(' Bug ', 'red')._id, 'old');
});

test('negative: a different color, case or inner space is a different label', () => {
  const b = board([{ _id: 'a', name: 'Bug Fix', color: 'red' }]);
  assert.equal(b.getLabel('Bug Fix', 'blue'), undefined, 'color');
  assert.equal(b.getLabel('bug fix', 'red'), undefined, 'case');
  assert.equal(b.getLabel('Bug  Fix', 'red'), undefined, 'inner whitespace');
});

test('a color-only label (no name) is found by an empty or whitespace-only name, and a board without labels finds nothing', () => {
  const b = board([{ _id: 'c', name: '', color: 'green' }, { _id: 'd', color: 'blue' }]);
  assert.equal(b.getLabel('  ', 'green')._id, 'c');
  assert.equal(b.getLabel('', 'green')._id, 'c');
  assert.equal(board(undefined).getLabel('Bug', 'red'), undefined);
  assert.equal(board([null, { name: 'x', color: 'red' }]).getLabel('x', 'red').name, 'x');
});

test('the REST builder trims object and string names the same way, and keeps the rest of the name', () => {
  for (const name of [' Bug ', '\tBug\n', ' Bug ']) {
    assert.deepEqual(buildBoardLabel(name, COLORS), buildBoardLabel('Bug', COLORS));
    assert.deepEqual(buildBoardLabel({ name }, COLORS), buildBoardLabel('Bug', COLORS));
  }
  assert.equal(buildBoardLabel({ name: '  Bug  Fix  ', color: 'blue' }, COLORS).name, 'Bug  Fix');
  assert.equal(buildBoardLabel('bug', COLORS).name, 'bug');
  for (const name of ['', undefined, null, ' \t\n ']) assert.deepEqual(buildBoardLabel({ name, color: 'red' }, COLORS), { ok: true, name: '', color: 'red' });
  // negative: a bad color is still refused before any lookup
  assert.equal(buildBoardLabel({ name: ' Bug ', color: 'invalid' }, COLORS).ok, false);
});

test('the lookup is the one every label creation uses: REST, the card form, the importers, the list sync', () => {
  assert.match(source, /getLabel\(name, color\) \{\s+const wanted = typeof name === 'string' \? name\.trim\(\) : name;/);
  assert.doesNotMatch(source, /findWhere\(this\.labels, \{ name, color \}\)/, 'no exact-name lookup is left');
  const rest = fs.readFileSync(path.join(__dirname, '../server/models/boards.js'), 'utf8');
  assert.match(rest, /board\.getLabel\(name, color\)/);
  assert.match(fs.readFileSync(path.join(__dirname, '../models/lib/restLabel.js'), 'utf8'), /String\(name\)\.trim\(\)/);
});
