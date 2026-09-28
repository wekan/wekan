'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
test('providers participate in real Filter queries, scoped reset and versioned preset preflight', async () => {
  const { register } = require('node:module');
  const { pathToFileURL } = require('node:url');
  const path = require('node:path');
  register(pathToFileURL(path.join(__dirname, 'helpers/meteorStubLoader.mjs')), pathToFileURL(__filename));
  const { Filter } = await import('../client/lib/filter.js');
  const { captureFilterPreset: capture, applyFilterPreset: apply } = await import('../client/lib/filterPresetState.js');
  const { validateFilterPresetState: validate } = await import('../models/lib/filterPresetState.js');
  Filter.reset();
  const legacy = capture(Filter);
  let value = '', globalValue = '';
  const definition = { id: 'test.description', version: 1, scope: 'board', template: 'textFilterProvider',
    data: () => ({ get: () => value, set: text => { value = text; } }),
    isActive: () => value !== '', selector: () => ({ description: value }), reset: () => { value = ''; },
    capture: () => value, validate: text => typeof text === 'string', restore: text => { value = text; } };
  const remove = Filter.providers.register(definition);
  const removeGlobal = Filter.providers.register({ ...definition, id: 'test.global', scope: 'global',
    isActive: () => !!globalValue, selector: () => ({ title: globalValue }), reset: () => { globalValue = ''; },
    capture: () => globalValue, restore: text => { globalValue = text; } });
  assert.throws(() => Filter.providers.register(definition), /Duplicate/);
  for (const bad of [{ id: '__proto__' }, { version: 0 }, { scope: 'arbitrary' }, { reset: null }, { legacyPreset: true }]) {
    assert.throws(() => Filter.providers.register({ ...definition, id: 'test.invalid', ...bad }), /Invalid/);
  }
  value = 'board text'; globalValue = 'global text';
  assert.equal(Filter.isActive(), true);
  assert.deepEqual(Filter._getMongoSelector(), { $and: [{ description: value }, { title: globalValue }] });
  assert.deepEqual(Filter.providers.views().map(view => view.id), ['test.description', 'test.global']);
  assert.deepEqual(Filter.providers.views('dates').map(view => view.id), ['wekan.date-recency']);
  const saved = capture(Filter); assert.equal(saved.version, 2);
  assert.equal(saved.providers['test.description'].value, value);
  Filter.resetBoardScoped(); assert.equal(value, ''); assert.equal(globalValue, 'global text');
  apply(Filter, saved); assert.equal(value, 'board text');
  const invalid = structuredClone(saved); invalid.providers['test.description'].version = 2;
  assert.throws(() => apply(Filter, invalid), /Unavailable/);
  assert.equal(value, 'board text'); assert.equal(globalValue, 'global text');
  const invalidValue = structuredClone(saved); invalidValue.providers['test.description'].value = 42;
  assert.throws(() => apply(Filter, invalidValue), /Unavailable/);
  assert.equal(value, 'board text'); assert.equal(globalValue, 'global text');
  for (const mutate of [s => { s.providers['test.description'].value = () => {}; },
    s => { s.providers['test.description'].value = new Date(); },
    s => { s.providers['test.description'].value = { constructor: 'poison' }; }]) {
    const bad = structuredClone(saved); mutate(bad); assert.throws(() => validate(bad), /Invalid/);
  }
  apply(Filter, legacy);
  assert.equal(value, ''); assert.equal(globalValue, '', 'v1 restores reset extension state');
  apply(Filter, saved);
  remove(); assert.equal(value, '');
  assert.throws(() => apply(Filter, saved), /Unavailable/);
  assert.equal(globalValue, 'global text', 'missing provider refuses before resetting other filters');
  remove(); removeGlobal(); Filter.reset();
  assert.equal(capture(Filter).version, 1, 'legacy snapshots remain supported without extensions');
});
