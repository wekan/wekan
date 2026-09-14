const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
test('Valencian ordinary checklist prose uses the existing localized term', () => {
  const d = JSON.parse(fs.readFileSync('imports/i18n/data/ca@valencia.i18n.json', 'utf8'));
  for (const key of ['r-checklist', 'newlineBecomesNewChecklistItem', 'newLineNewItem',
    'newlineBecomesNewChecklistItemOriginOrder', 'hideAllChecklistItems', 'hide-finished-checklist', 'hideCheckedChecklistItems']) {
    assert.match(d[key], /llist(?:a|es) de verificació/);
    assert.doesNotMatch(d[key], /checklist|llistadecontrol/i);
  }
  assert.match(d.newlineBecomesNewChecklistItemOriginOrder, /ordre original/);
  assert.match(d.hideCheckedChecklistItems, /elements marcats/);
  assert.match(d.hideAllChecklistItems, /tots els elements/);
  assert.match(d['hide-finished-checklist'], /acabades/);
  assert.match(d.newLineNewItem, /Una línia de text = un element/);
});
