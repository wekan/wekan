const { test } = require('node:test');
const assert = require('node:assert/strict');
const { syncEstimateMapping, addSyncEstimates, cardSyncEstimate, estimateChanges } = require('../models/lib/listSyncEstimate');
const { planSyncTextMerge, syncTextSelector } = require('../models/lib/listSyncTextMerge');
const { planSyncConflictResolution } = require('../server/lib/listSyncConflict');
const { describeSyncConflict } = require('../server/lib/listSyncConflict');
const definition = { _id: 'local', type: 'number', settings: { jiraEstimateFieldId: 'customfield_100', jiraEstimateUnit: 'points' } };
const source = { type: 'jira', fields: ['estimate'], estimateCustomFieldId: 'local' };
const mapping = syncEstimateMapping(source, definition);
test('only explicitly selected numeric Jira mappings are usable', () => {
  assert.equal(syncEstimateMapping({ fields: [] }), null);
  for (const [s, d] of [[{ ...source, type: 'gitlab' }, definition], [source, null],
    [source, { ...definition, type: 'text' }], [source, { ...definition, settings: {} }]]) {
    assert.throws(() => syncEstimateMapping(s, d));
  }
  assert.notEqual(syncEstimateMapping(source, { ...definition, settings: {
    ...definition.settings, jiraEstimateUnit: 'hours' } }).identity, mapping.identity);
});
test('estimates preserve zero, null clearing and absent values without numeric coercion', () => {
  for (const value of [0, 4.5, null, undefined]) {
    const [task] = addSyncEstimates([{ externalId: 'A' }], { issues: [{ key: 'A', fields: { customfield_100: value } }] }, mapping);
    assert.equal(task.estimate, value);
    assert.equal(Object.hasOwn(task, 'estimate'), value !== undefined);
  }
  for (const value of ['3', -1, Infinity, {}, 1e13]) {
    assert.throws(() => addSyncEstimates([{ externalId: 'A' }], [{ key: 'A', fields: { customfield_100: value } }], mapping));
  }
});
test('updates preserve unrelated fields and null removes only the selected value', () => {
  const card = { customFields: [{ _id: 'other', value: 'Keep' }, { _id: 'local', value: 0 }] };
  assert.equal(cardSyncEstimate(card, mapping), 0);
  assert.deepEqual(estimateChanges({ estimate: null }, card, mapping), { customFields: [{ _id: 'other', value: 'Keep' }] });
  assert.deepEqual(estimateChanges({ estimate: 2 }, card, mapping).customFields,
    [{ _id: 'other', value: 'Keep' }, { _id: 'local', value: 2 }]);
  assert.equal(card.customFields[1].value, 0);
  assert.deepEqual(estimateChanges({ estimate: 2 }, { customFields: [...card.customFields].reverse() }, mapping).customFields,
    [{ _id: 'local', value: 2 }, { _id: 'other', value: 'Keep' }]);
  assert.throws(() => cardSyncEstimate({ customFields: [card.customFields[1], card.customFields[1]] }, mapping), /Duplicate/);
  assert.deepEqual(syncTextSelector({ ...card, estimate: 0 }, 'b', 'l').customFields, { $eq: card.customFields });
  assert.ok(!Object.hasOwn(syncTextSelector(card, 'b', 'l'), 'customFields'));
  assert.deepEqual(syncTextSelector({ estimate: null, customFields: null }, 'b', 'l').customFields, { $eq: null, $exists: true });
});
test('local estimates and changed mappings require explicit conflict review', () => {
  const card = { _id: 'c', syncExternalId: 'A', estimate: 3, syncLastSource: { estimate: 2, estimateMapping: mapping.identity } };
  assert.equal(planSyncTextMerge([{ externalId: 'A', estimate: 2 }], [card], mapping).tasks[0].estimate, 3);
  const incoming = [{ externalId: 'A', estimate: 4 }];
  const plan = planSyncTextMerge(incoming, [card], mapping);
  assert.equal(plan.conflicts[0].field, 'estimate');
  const list = { _id: 'l', boardId: 'b', syncRevision: 'rev' };
  const preview = describeSyncConflict(plan.conflicts[0], card, incoming[0], list, 'source');
  const resolved = planSyncConflictResolution(plan.conflicts, [card], incoming, list, 'source',
    { cardId: 'c', field: 'estimate', choice: 'source', fingerprint: preview.fingerprint }, mapping);
  assert.equal(resolved.changes.estimate, 4);
  assert.equal(resolved.changes.syncLastSource.estimateMapping, mapping.identity);
  const changed = { ...mapping, identity: 'new mapping' };
  assert.equal(planSyncTextMerge([{ externalId: 'A', estimate: 2 }], [card], changed).conflicts.length, 1);
  const blank = { ...card, estimate: null, syncLastSource: { estimate: null, estimateMapping: mapping.identity } };
  assert.equal(planSyncTextMerge([{ externalId: 'A', estimate: 0 }], [blank], mapping).conflicts.length, 0);
});
test('source coverage recognizes only the explicitly mapped estimate field', () => {
  const { describeSyncSourceCoverage } = require('../server/lib/listSyncSourceCoverage');
  const raw = { issues: [{ key: 'A', fields: { customfield_100: 0, customfield_200: 5 } }] };
  const result = describeSyncSourceCoverage('jira', raw, ['estimate'], mapping);
  assert.ok(!result.rows.some(row => row.path.endsWith('/customfield_100')));
  assert.ok(result.rows.some(row => row.path.endsWith('/customfield_200') && row.reason === 'unmapped'));
  assert.ok(describeSyncSourceCoverage('jira', raw, [], mapping).rows.some(row =>
    row.path.endsWith('/customfield_100') && row.reason === 'excluded'));
});
