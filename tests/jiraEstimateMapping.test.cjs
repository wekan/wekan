'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateJiraEstimateMapping, jiraEstimateValue, jiraEstimateExportMapping, jiraEstimateExportValue } = require('../models/lib/jiraEstimateMapping');
const mapping = { estimateFieldId: 'customfield_10016', estimateUnit: 'points' };
const field = { _id: 'local', type: 'number', settings: { jiraEstimateFieldId: mapping.estimateFieldId, jiraEstimateUnit: 'points' } };
test('explicit numeric mapping preserves zero, decimal and missing estimates', () => {
  assert.deepEqual(validateJiraEstimateMapping({ wekanScrumMapping: mapping, issues: [{ fields: { customfield_10016: 0 } }] }), mapping);
  for (const value of [0, 2.5, 1e12]) assert.equal(jiraEstimateValue({ customfield_10016: value }, mapping), value);
  assert.equal(jiraEstimateValue({}, mapping), undefined);
  assert.equal(jiraEstimateValue({ customfield_10016: null }, mapping), undefined);
  assert.equal(validateJiraEstimateMapping({ issues: [] }), null);
  assert.deepEqual(validateJiraEstimateMapping({ wekanScrumMapping: mapping, issues: [], schema: { customfield_10016: { type: 'number' } } }), mapping);
});
test('mapping rejects guessed fields, missing units, wrong schema and invalid values', () => {
  for (const estimateFieldId of ['Story Points', '__proto__', 'customfield_a', 'summary']) {
    assert.throws(() => validateJiraEstimateMapping({ wekanScrumMapping: { ...mapping, estimateFieldId }, issues: [] }));
  }
  assert.throws(() => validateJiraEstimateMapping({ wekanScrumMapping: { ...mapping, estimateUnit: '' }, issues: [] }));
  assert.throws(() => validateJiraEstimateMapping({ wekanScrumMapping: mapping, issues: [] }), /absent/);
  assert.throws(() => validateJiraEstimateMapping({ wekanScrumMapping: mapping, issues: [{ fields: { customfield_10016: 1 } }], schema: { customfield_10016: { type: 'string' } } }), /numeric/);
  for (const value of [-1, '3', true, {}, Infinity, NaN, 1e12 + 1]) assert.throws(() => jiraEstimateValue({ customfield_10016: value }, mapping));
});
test('export uses markers, requires both sections and omits ambiguous mapping', () => {
  const exported = jiraEstimateExportMapping([field]);
  assert.equal(exported.localFieldId, 'local');
  assert.deepEqual(jiraEstimateExportValue({ customFields: [{ _id: 'local', value: 0 }] }, exported), { customfield_10016: 0 });
  assert.equal(jiraEstimateExportMapping([field, { ...field, _id: 'duplicate' }]), null);
  for (const selected of [['scrum'], ['custom-fields'], ['dates']]) assert.equal(jiraEstimateExportMapping([field], new Set(selected)), null);
  assert.ok(jiraEstimateExportMapping([field], new Set(['scrum', 'custom-fields'])));
  assert.deepEqual(jiraEstimateExportValue({ customFields: [{ _id: 'local', value: -1 }] }, exported), {});
});
