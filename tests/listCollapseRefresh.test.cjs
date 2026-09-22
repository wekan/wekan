'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const { test } = require('node:test');

const utils = fs.readFileSync('client/lib/utils.js', 'utf8');
const getter = utils.slice(utils.indexOf('  getListCollapseState('), utils.indexOf('  setListCollapseState('));

test('a saved collapsed value can replace the default after profile hydration', () => {
  assert.match(getter, /Session\.get\(key\)/);
  assert.match(getter, /getCollapsedListFromStorage\(list\.boardId, storageId\)/);
  assert.doesNotMatch(getter, /Session\.setDefault\(key,/);
  assert.match(getter, /return stored;/);
});

test('an explicit local toggle still wins while the server persists it', () => {
  const setter = utils.slice(utils.indexOf('  setListCollapseState('), utils.indexOf('  getCardCollapseState('));
  assert.match(setter, /Session\.set\(key, !!collapsed\)/);
  assert.match(setter, /Meteor\.call\('setListCollapsedState'/);
});
