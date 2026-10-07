'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { test } = require('node:test');
const { DRAG_SETTINGS, canDrag, canDragSelection } = require('../models/lib/boardDragging');
test('drag permission column has translated labels with preserved tokens', async () => {
  const { translationTokens } = await import('../releases/translations/placeholder-tokens.mjs');
  const en = JSON.parse(fs.readFileSync('imports/i18n/data/en.i18n.json'));
  const codes = fs.readdirSync('imports/i18n/data')
    .filter(file => file.endsWith('.i18n.json') && !/^en(?:[-_]|\.)/.test(file))
    .map(file => file.replace('.i18n.json', ''));
  assert.equal(codes.length, 234);
  for (const code of codes) {
    const locale = JSON.parse(fs.readFileSync(`imports/i18n/data/${code}.i18n.json`));
    assert.ok(locale.draggable?.trim(), code);
    assert.notEqual(locale.draggable, en.draggable, code);
    assert.deepEqual(translationTokens(locale.draggable), translationTokens(en.draggable), code);
  }
});
for (const setting of DRAG_SETTINGS) {
  assert.equal(canDrag({}, setting.kind), true, 'legacy boards default enabled');
  assert.equal(canDrag({ [setting.field]: true }, setting.kind), true);
  assert.equal(canDrag({ [setting.field]: false }, setting.kind), false);
  assert.equal(canDragSelection({ [setting.field]: false }, [{ kind: 'card' }, { kind: setting.kind }]), false);
  for (const other of DRAG_SETTINGS.filter(other => other !== setting)) {
    assert.equal(canDrag({ [setting.field]: false }, other.kind), true);
  }
  for (const path of ['models/boards.js', 'server/lib/schemaUpgradeSteps.js', 'server/models/boards.js']) {
    assert.ok(fs.readFileSync(path, 'utf8').includes(setting.field), `${path}: ${setting.field}`);
  }
}
assert.equal(canDrag(null, 'card'), false);
assert.equal(canDrag({}, 'unknown'), false);
assert.equal(canDragSelection({}, [{ kind: 'card' }, { kind: 'item' }]), true);
console.log('Board dragging defaults, independent switches and mixed-selection policy passed');
