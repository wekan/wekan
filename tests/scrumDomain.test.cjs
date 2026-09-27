const { test } = require('node:test');
const assert = require('node:assert/strict');
const { DEFAULT_SCRUM_SETTINGS: defaults, normalizeScrumSettings, normalizeScrumMetadata,
  normalizeScrumRecord, getCardEstimate, sprintSnapshot, validateScrumRevision } = require('../models/lib/scrum');

test('Scrum metadata is opt-in, bounded, strict and data-only', () => {
  assert.equal(defaults.enabled, false);
  assert.deepEqual(defaults.visibility, {});
  assert.deepEqual(normalizeScrumSettings({ visibility: { cardSprint: true, listCategory: false } }),
    { visibility: { cardSprint: true, listCategory: false } });
  assert.throws(() => normalizeScrumSettings({ visibility: { cardSprint: 'true' } }));
  assert.throws(() => normalizeScrumSettings({ visibility: { isAdmin: true } }));
  assert.deepEqual(normalizeScrumSettings({ productGoal: 'Deliver value' }), { productGoal: 'Deliver value' });
  for (const input of [{ isAdmin: true }, { enabled: 'true' }, { workingDays: [0] }, { workingDays: [] }, { productGoal: 'x'.repeat(10001) }]) {
    assert.throws(() => normalizeScrumSettings(input));
  }
  assert.throws(() => normalizeScrumMetadata('card', { backlogRank: Infinity }));
  assert.throws(() => normalizeScrumMetadata('card', { backlogRank: -1 }));
  assert.deepEqual(normalizeScrumMetadata('card', { backlogRank: null }), { backlogRank: null });
  assert.throws(() => normalizeScrumMetadata('card', { sprintId: '' }));
  assert.throws(() => normalizeScrumMetadata('card', { boardId: 'foreign' }));
  assert.throws(() => normalizeScrumMetadata('card', { pastSprintIds: [null] }));
  assert.deepEqual(normalizeScrumMetadata('card', { sprintId: null, backlogRank: 0, acceptanceCriteria: 'Works' }),
    { sprintId: null, backlogRank: 0, acceptanceCriteria: 'Works' });
  assert.deepEqual(normalizeScrumMetadata('list', { category: 'done' }), { category: 'done' });
  assert.throws(() => normalizeScrumMetadata('list', { category: 'translated title' }));
  assert.throws(() => validateScrumRevision(1.5));
});

test('Scrum record dates reject invalid calendar values and preserve UTC boundaries', () => {
  const sprint = normalizeScrumRecord('sprint', { name: 'Sprint', plannedStart: '2026-03-29T00:00:00Z', plannedEnd: '2026-04-12T00:00:00Z' });
  assert.equal(sprint.plannedStart.toISOString(), '2026-03-29T00:00:00.000Z');
  assert.equal(sprint.plannedEnd - sprint.plannedStart, 14 * 86400000);
  for (const input of ['2026-02-30', '2026-02-30T12:00:00Z', 'tomorrow', '2026-03-29T00:00:00+02:00']) {
    assert.throws(() => normalizeScrumRecord('sprint', { plannedStart: input }));
  }
  assert.throws(() => normalizeScrumRecord('sprint', { plannedStart: '2026-09-30', plannedEnd: '2026-09-01' }));
  assert.throws(() => normalizeScrumRecord('sprint', { startSnapshot: {} }));
  assert.throws(() => normalizeScrumRecord('event', { kind: 'executeCode' }));
  assert.throws(() => normalizeScrumRecord('event', { timeboxMinutes: 20000 }));
});

test('estimation distinguishes zero, missing, invalid and numeric custom fields', () => {
  assert.equal(getCardEstimate({}), null);
  assert.equal(getCardEstimate({ poker: { estimation: 0 } }), 0);
  assert.equal(getCardEstimate({ poker: { estimation: -1 } }), null);
  assert.equal(getCardEstimate({ poker: { estimation: Infinity } }), null);
  const settings = { ...defaults, estimateSource: 'customField', estimateCustomFieldId: 'points' };
  for (const value of ['', ' ', '?', null, false, [], {}]) assert.equal(getCardEstimate({ customFields: [{ _id: 'points', value }] }, settings), null);
  assert.equal(getCardEstimate({ customFields: [{ _id: 'points', value: '0' }] }, settings), 0);
  assert.equal(getCardEstimate({ customFields: [{ _id: 'points', value: '2.5' }] }, settings), 2.5);
});

test('commitment snapshots retain original estimates and explicit completion semantics', () => {
  const cards = [{ _id: 'zero', poker: { estimation: 0 }, listId: 'done', dueComplete: false },
    { _id: 'missing', listId: 'todo', dueComplete: true, archived: true }];
  const settings = { ...defaults, completionPolicy: 'doneLists' };
  const snapshot = sprintSnapshot(cards, settings, [{ _id: 'done', scrum: { category: 'done' } }]);
  assert.equal(snapshot.missingEstimates, 1); assert.equal(snapshot.totalEstimate, 0);
  assert.equal(snapshot.cards[0].done, true); assert.equal(snapshot.cards[1].done, false);
  cards[0].poker.estimation = 8;
  assert.equal(snapshot.cards[0].estimate, 0);
  const closed = sprintSnapshot(cards, defaults, []);
  assert.equal(closed.cards[1].done, true); // Archiving does not undo completion.
  assert.equal(closed.unit, 'points');
});
