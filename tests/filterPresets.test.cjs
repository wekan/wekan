'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
test('saved filters round-trip every field, preserve no-value selections and validate before changing live filters', async t => {
  const { register } = require('node:module');
  const { pathToFileURL } = require('node:url');
  const path = require('node:path');
  register(pathToFileURL(path.join(__dirname, 'helpers/meteorStubLoader.mjs')), pathToFileURL(__filename));
  const originalRequire = global.require;
  global.require = id => {
    assert.equal(id, '/client/features/sidebar/service');
    return { getSidebarInstance: () => ({ setView() {} }) };
  };
  t.after(() => { global.require = originalRequire; });
  const { Filter } = await import('../client/lib/filter.js');
  const { captureFilterPreset: capture, applyFilterPreset: apply } = await import('../client/lib/filterPresetState.js');
  const { FILTER_PRESET_SETS: sets, FILTER_PRESET_TEXTS: texts, validateFilterPresetState: validate } = await import('../models/lib/filterPresetState.js');
  Filter.reset();
  for (const key of sets) { Filter[key].add(`${key}-value`); Filter[key].add(undefined); }
  for (const key of texts) Filter[key].set(`${key} text`);
  Filter.labelIds.setMode('and'); Filter.dueAt.nextMonth();
  Filter.dateRange.set({ field: 'endAt', from: '2026-09-01', to: '2026-09-02', includeMissing: true });
  Filter.movementDate.set({ field: 'createdAt', from: '2026-09-01', to: '', includeMissing: false });
  Filter.dateRecency.set({ createdAt: 'week', modifiedAt: 'older' }); Filter.columnAge.set('list', 30);
  const saved = capture(Filter);
  assert.equal(saved.due, 'nextmonth');
  assert.ok(saved.sets.labelIds.includes(null));
  Filter.reset(); apply(Filter, saved);
  assert.deepEqual(capture(Filter), saved);
  assert.equal(Filter.labelIds.isSelected(undefined), true);
  for (const change of [s => { s.version = 2; }, s => { s.ownerId = 'victim'; }, s => { s.due = '__proto__'; },
    s => { s.due = ['past']; }, s => { s.sets.members = [{ $ne: null }]; }, s => { s.texts.text = 'x'.repeat(513); },
    s => { s.columnAge.days = 0; }, s => { s.dateRange.to = '2026-01-01'; }, s => { s.movementDate.includeMissing = true; }]) {
    const invalid = structuredClone(saved); change(invalid);
    assert.throws(() => validate(invalid), /Invalid/);
    assert.throws(() => apply(Filter, invalid), /Invalid/);
    assert.deepEqual(capture(Filter), saved);
  }
  const validateExpression = Filter.advanced.validate;
  Filter.advanced.validate = () => { throw new Error('Deleted custom field'); };
  assert.throws(() => apply(Filter, saved), /Deleted/);
  Filter.advanced.validate = validateExpression;
  assert.deepEqual(capture(Filter), saved);
  Filter.reset();
});
