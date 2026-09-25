'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { columnFields, columnModifier } = require('../models/lib/boardSettingsColumns');
const { CARD_SETTINGS_ROWS } = require('../models/lib/cardSettingsRows');
const columns = [['swimlane','draggable'], ['list','draggable'], ['card','draggable'], ['swimlane','settings'], ['list','settings'], ['card','card'], ['card','minicard']];
const schema = fs.readFileSync('models/boards.js', 'utf8');
for (const [section, column] of columns) {
  const fields = columnFields(section, column);
  assert.ok(fields.length);
  assert.equal(new Set(fields).size, fields.length);
  for (const field of fields) assert.match(schema, new RegExp(`\\b${field}:\\s*\\{`));
  for (const enabled of [false,true]) {
    const modifier = columnModifier(section, column, enabled);
    assert.deepEqual(Object.keys(modifier.$set), fields);
    assert.ok(Object.values(modifier.$set).every(value => value === enabled));
    const state = {...modifier.$set, unrelated: 'preserved'};
    assert.deepEqual({...state,...modifier.$set}, state, 'idempotent');
  }
}
for (const row of CARD_SETTINGS_ROWS) for (const side of ['card','minicard']) {
  if (row[side]?.personal || row[side]?.needsCard) assert.ok(!columnFields('card',side).includes(row[side].field));
}
assert.ok(columnFields('card','minicard').includes('showLabelText'));
assert.ok(!columnFields('card','minicard').includes('allowsLabelText'));
assert.equal(columnModifier('card','card','false'), null);
for (const value of ['__proto__','members','owner','unknown']) {
  assert.equal(columnModifier('card', value, true), null);
  assert.equal(columnModifier(value, 'draggable', true), null);
}
console.log('Board settings columns: seven scoped allowlists, both values, schema fields, personal exclusions and invalid input passed');
