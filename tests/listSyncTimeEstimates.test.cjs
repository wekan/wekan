const { test } = require('node:test');
const assert = require('node:assert/strict');
const time = require('../models/lib/listSyncTimeEstimates');
const { planSyncTextMerge, selectSyncTextFields, syncTextSelector } = require('../models/lib/listSyncTextMerge');
const { describeSyncConflict, planSyncConflictResolution } = require('../server/lib/listSyncConflict');
const { describeSyncSourceCoverage } = require('../server/lib/listSyncSourceCoverage');
const definitions = ['original', 'remaining'].map(key => ({ _id: key, type: 'number', settings: { jiraTimeField: key } }));
const source = { type: 'jira', fields: ['originalEstimate', 'remainingEstimate'] };
const mappings = time.syncTimeMappings(source, definitions);
const parse = fields => time.addSyncTimeEstimates([{ externalId: 'A' }], { issues: [{ key: 'A', fields }] }, mappings)[0];
test('time mappings require one unambiguous numeric Jira field and reject shared estimate targets', () => {
  assert.deepEqual(time.syncTimeMappings({ fields: [] }, definitions), {});
  for (const defs of [[], [definitions[0]], [...definitions, definitions[0]], definitions.map(d => ({ ...d, type: 'text' }))]) {
    assert.throws(() => time.syncTimeMappings(source, defs));
  }
  assert.throws(() => time.syncTimeMappings({ ...source, type: 'github' }, definitions));
  assert.throws(() => time.syncTimeMappings(source, definitions, { localFieldId: 'original' }));
  assert.equal(mappings.originalEstimate.identity, JSON.stringify(['original', 'original', 'hours']));
});
test('numeric seconds become hours; zero, explicit null and missing remain distinct', () => {
  assert.deepEqual(parse({ timetracking: { originalEstimateSeconds: 5400, remainingEstimateSeconds: 0 } }),
    { externalId: 'A', originalEstimate: 1.5, remainingEstimate: 0 });
  assert.equal(parse({ timeoriginalestimate: 7200 }).originalEstimate, 2);
  assert.equal(parse({ timeoriginalestimate: 7200, timetracking: { originalEstimateSeconds: null } }).originalEstimate, null);
  assert.equal(Object.hasOwn(parse({}), 'originalEstimate'), false);
  for (const value of [-1, 1.5, '3600', true, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => parse({ timetracking: { originalEstimateSeconds: value } }));
  }
  assert.deepEqual(selectSyncTextFields([parse({ timeoriginalestimate: 0 })], []), [{ externalId: 'A' }]);
});
test('combined estimate changes preserve unrelated values and clear only the named field', () => {
  const card = { customFields: [{ _id: 'other', value: false }, { _id: 'original', value: 8 }, { _id: 'remaining', value: 3 }] };
  const change = time.syncValueChanges({ estimate: 5, originalEstimate: null, remainingEstimate: 0 }, card,
    { localFieldId: 'points' }, mappings);
  assert.deepEqual(change, { customFields: [{ _id: 'other', value: false }, { _id: 'remaining', value: 0 }, { _id: 'points', value: 5 }] });
  assert.equal(card.customFields.length, 3);
  assert.deepEqual(time.cardSyncTimes(card, mappings), { originalEstimate: 8, remainingEstimate: 3 });
  assert.throws(() => time.cardSyncTimes({ customFields: [{ _id: 'original', value: 'bad' }] }, mappings));
});
test('three-way conflict resolution and mapping changes retain local edits', () => {
  const baseline = time.syncTimeBaseline({ originalEstimate: 2, remainingEstimate: 1 }, mappings);
  const card = { _id: 'card', syncExternalId: 'A', originalEstimate: 2, remainingEstimate: 3,
    customFields: [{ _id: 'remaining', value: 3 }], syncLastSource: baseline };
  const incoming = { externalId: 'A', originalEstimate: 4, remainingEstimate: 2 };
  const merge = planSyncTextMerge([incoming], [card], null, mappings);
  assert.deepEqual(merge.conflicts.map(c => c.field), ['remainingEstimate']);
  const list = { _id: 'list', boardId: 'board' };
  const conflict = describeSyncConflict(merge.conflicts[0], card, incoming, list, 'source');
  const request = { cardId: 'card', field: 'remainingEstimate', choice: 'source', fingerprint: conflict.fingerprint };
  const resolved = planSyncConflictResolution(merge.conflicts, [card], [incoming], list, 'source', request, null, mappings);
  assert.equal(resolved.changes.remainingEstimate, 2);
  const local = planSyncConflictResolution(merge.conflicts, [card], [incoming], list, 'source', { ...request, choice: 'local' }, null, mappings);
  assert.equal(Object.hasOwn(local.changes, 'remainingEstimate'), false);
  assert.equal(local.changes.syncLastSource.remainingEstimate, 2);
  assert.equal(resolved.changes.syncLastSource.remainingEstimateMapping, mappings.remainingEstimate.identity);
  assert.equal(planSyncConflictResolution(merge.conflicts, [card], [{ ...incoming, remainingEstimate: 5 }], list, 'source', request, null, mappings), null);
  assert.ok(syncTextSelector(card, 'board', 'list').customFields);
  const changed = { ...mappings, originalEstimate: { ...mappings.originalEstimate, identity: 'different field' } };
  assert.ok(planSyncTextMerge([incoming], [card], null, changed).conflicts.some(row => row.field === 'originalEstimate'));
});
test('source coverage recognizes selected time fields and labels the unused flat fallback', () => {
  const raw = { issues: [{ key: 'A', fields: { timeoriginalestimate: 3600, timetracking: { originalEstimateSeconds: 7200 } } }] };
  const report = describeSyncSourceCoverage('jira', raw, source.fields, null, mappings);
  assert.ok(report.rows.some(row => row.path.endsWith('/timeoriginalestimate') && row.reason === 'fallback'));
  assert.ok(!report.rows.some(row => row.path.endsWith('/originalEstimateSeconds') && row.reason === 'unmapped'));
});
