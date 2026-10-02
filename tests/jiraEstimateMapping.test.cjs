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

// Discovery (2026-10-02): the numeric fields the export declares are offered
// on the import page, and the one field of Jira Software's story points TYPE
// is used without an explicit mapping. Names are never guessed from.
{
  const { jiraEstimateCandidates, discoveredJiraEstimateMapping, validateJiraEstimateMapping } =
    require('../models/lib/jiraEstimateMapping');
  const SP = 'com.pyxis.greenhopper.jira:jsw-story-points';
  const data = { names: { customfield_10016: 'Story point estimate', customfield_10030: 'Business value',
    customfield_10040: 'Team' },
  schema: { customfield_10016: { type: 'number', custom: SP }, customfield_10030: { type: 'number' },
    customfield_10040: { type: 'string' } },
  issues: [{ key: 'P-1', fields: { customfield_10016: 3 } }] };
  assert.deepEqual(jiraEstimateCandidates(data), [
    { fieldId: 'customfield_10016', name: 'Story point estimate', storyPoints: true },
    { fieldId: 'customfield_10030', name: 'Business value', storyPoints: false }]);
  assert.deepEqual(discoveredJiraEstimateMapping(data), { estimateFieldId: 'customfield_10016', estimateUnit: 'points' });
  assert.deepEqual(validateJiraEstimateMapping(data), { estimateFieldId: 'customfield_10016', estimateUnit: 'points' });
  // An explicit mapping still wins.
  assert.equal(validateJiraEstimateMapping({ ...data, wekanScrumMapping: { estimateFieldId: 'customfield_10030',
    estimateUnit: 'value' } }).estimateFieldId, 'customfield_10030');
  // Negative: a field merely NAMED like story points, two story point fields,
  // or no schema at all - nothing is chosen.
  assert.equal(discoveredJiraEstimateMapping({ names: { customfield_1: 'Story Points' },
    schema: { customfield_1: { type: 'number' } } }), null);
  assert.equal(discoveredJiraEstimateMapping({ schema: { customfield_1: { type: 'number', custom: SP },
    customfield_2: { type: 'number', custom: SP } } }), null);
  assert.deepEqual(jiraEstimateCandidates({ issues: [] }), []);
  assert.equal(validateJiraEstimateMapping({ issues: [] }), null);
  const fs = require('node:fs'), path = require('node:path');
  const jade = fs.readFileSync(path.join(__dirname, '../client/components/import/import.jade'), 'utf8');
  assert.match(jade, /list='jira-estimate-fields'\)\n\s*datalist#jira-estimate-fields\n\s*each jiraEstimateCandidates/);
  console.log('  ok - estimate fields are discovered from the schema, never from names');
}
