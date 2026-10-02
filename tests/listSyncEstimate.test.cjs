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

// GitLab's own estimates (2026-10-02): weight in points, or the time estimate
// in hours, into a numeric field the administrator picks.
test('GitLab: weight or time estimate into a picked numeric field', () => {
  const gitlab = { type: 'gitlab', fields: ['estimate'], estimateCustomFieldId: 'local', estimateSourceField: 'weight' };
  const plain = { _id: 'local', type: 'number', settings: {} };
  const weight = syncEstimateMapping(gitlab, plain);
  assert.deepEqual([weight.provider, weight.estimateFieldId, weight.estimateUnit], ['gitlab', 'weight', 'points']);
  const time = syncEstimateMapping({ ...gitlab, estimateSourceField: 'time_estimate' }, plain);
  assert.equal(time.estimateUnit, 'hours');
  assert.notEqual(time.identity, weight.identity, 'changing the attribute changes the mapping');
  const issues = [{ iid: 3, weight: 5, time_stats: { time_estimate: 5400 } }, { iid: 4, weight: null },
    { iid: 5, time_stats: { time_estimate: 0 } }];
  const tasks = [{ externalId: '3' }, { externalId: '4' }, { externalId: '5' }];
  assert.deepEqual(addSyncEstimates(tasks, issues, weight).map(t => t.estimate), [5, null, undefined],
    'no weight clears; an issue without the attribute says nothing');
  assert.deepEqual(addSyncEstimates(tasks, issues, time).map(t => t.estimate), [1.5, undefined, 0], 'seconds in hours');
  // Negative: no attribute, an unknown one, a non-numeric field, another field.
  for (const [s, d] of [[{ ...gitlab, estimateSourceField: undefined }, plain], [{ ...gitlab, estimateSourceField: 'iid' }, plain],
    [gitlab, { ...plain, type: 'text' }], [gitlab, { ...plain, _id: 'other' }], [{ ...gitlab, type: 'github' }, plain]]) {
    assert.throws(() => syncEstimateMapping(s, d), /sync|estimate|Select/i);
  }
  assert.throws(() => addSyncEstimates([{ externalId: '3' }], [{ iid: 3, weight: -2 }], weight), /GitLab estimate/);
  // The durable journal accepts this identity, and only GitLab's two.
  const journal = require('fs').readFileSync(require('path').join(__dirname, '../server/lib/syncOperationJournal.js'), 'utf8');
  assert.match(journal, /parts\[1\]\.startsWith\('gitlab:'\)\s*&& Object\.hasOwn\(GITLAB_ESTIMATES, parts\[1\]\.slice\('gitlab:'\.length\)\)/);
  const { describeSyncSourceCoverage } = require('../server/lib/listSyncSourceCoverage');
  const rows = describeSyncSourceCoverage('gitlab', [{ iid: 3, title: 'T', weight: 5 }], ['title', 'estimate'], weight).rows;
  assert.ok(!rows.some(row => row.path.endsWith('/weight')), 'the weight is mapped, not reported as unmapped');
});
