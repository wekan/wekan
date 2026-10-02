'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { columnFields, columnModifier, columnScrumVisibility } = require('../models/lib/boardSettingsColumns');
const { normalizeScrumSettings } = require('../models/lib/scrum');
const { CARD_SETTINGS_ROWS } = require('../models/lib/cardSettingsRows');
const columns = [['swimlane','draggable'], ['list','draggable'], ['card','draggable'], ['swimlane','settings'], ['list','settings'], ['card','card'], ['card','minicard']];
const schema = fs.readFileSync('models/boards.js', 'utf8');
for (const [section, column] of columns) {
  const all = columnFields(section, column);
  // The Scrum rows' flags are saved through scrum.configure, not $set.
  const fields = all.filter(field => !field.startsWith('scrum.visibility.'));
  const scrum = all.filter(field => field.startsWith('scrum.visibility.')).map(field => field.slice(17));
  assert.ok(fields.length);
  assert.equal(new Set(all).size, all.length);
  for (const field of fields) assert.match(schema, new RegExp(`\\b${field}:\\s*\\{`));
  if (section === 'card' && column !== 'draggable') {
    assert.equal(scrum.length, column === 'card' ? 6 : 5, 'every Scrum row of the column');
    // Every key is one scrum.configure accepts (negative: no unknown flag).
    assert.doesNotThrow(() => normalizeScrumSettings({ visibility: columnScrumVisibility(section, column, true) }));
  } else assert.deepEqual(scrum, []);
  for (const enabled of [false,true]) {
    assert.deepEqual(columnScrumVisibility(section, column, enabled), Object.fromEntries(scrum.map(key => [key, enabled])));
    const modifier = columnModifier(section, column, enabled);
    assert.deepEqual(Object.keys(modifier.$set), fields);
    assert.ok(!Object.keys(modifier.$set).some(key => key.startsWith('scrum')), 'no direct Scrum write');
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
