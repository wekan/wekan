'use strict';
const assert = require('node:assert/strict');
const { positionChange, timeAdjustments, withRemovedCards } = require('../models/lib/timeHistory');
const { blockerEpisodes } = require('../models/lib/flowAnalytics');
const { workerMayUpdateCard } = require('../models/lib/workerCardWrite');
const { flowDetailRows } = require('../models/lib/flowAnalyticsRows');
const { diffFields } = require('../models/lib/changeHistoryGroups');
const day = n => new Date(`2026-09-${String(n).padStart(2, '0')}T00:00:00Z`);
const before = { boardId: 'b', swimlaneId: 's', listId: 'l', sort: 0, lastMoveReason: 'old' };
const after = { ...before, listId: 'next', sort: 1, lastMoveReason: 'Waiting for review' };
const move = positionChange(before, after, ['listId', 'sort', 'lastMoveReason']);
assert.equal(move.group, 'position');
assert.deepEqual(move.previousContent, before);
assert.deepEqual(move.newContent, after);
assert.equal(positionChange(before, before, ['sort']), null);
assert.equal(positionChange(before, { ...before, lastMoveReason: 'edit' }, ['lastMoveReason']), null);
assert.equal(workerMayUpdateCard('u', { $set: { listId: 'next', lastMoveReason: 'ready' } }), true);
assert.equal(workerMayUpdateCard('u', { $set: { lastMoveReason: 'rewrite old reason' } }), false);
const rows = [[undefined, 4], [4, 2], [2, 0]].map(([a, b], i) => ({
  ...diffFields('card', { spentTime: a }, { spentTime: b }, ['spentTime'])[0],
  userId: i === 2 ? 'v' : 'u', entityId: 'c', createdAt: day(i + 1),
}));
const report = timeAdjustments(rows, id => `User ${id}`, () => 'Task');
assert.equal(report.entries.length, 3);
assert.deepEqual(report.groups.map(x => x.hours), [2, -2]);
assert.equal(report.entries[0].hours, -2);
assert.equal(report.entries[0].total, 0);
assert.equal(flowDetailRows('time', { adjustments: report }).rows.length, 3);
assert.equal(timeAdjustments([{ newContent: { field: 'spentTime', value: 'bad' } }]).entries.length, 0);
const cause = { _id: 'a', boardId: 'b', title: 'Cause', listId: 'l', cardDependencies: [{ cardId: 'c', type: 'blocks' }] };
const affected = { _id: 'c', boardId: 'b', title: 'Task', listId: 'l' };
const removal = { entityType: 'card', entityId: 'a', group: 'lifecycle', createdAt: day(5),
  previousContent: { document: cause }, newContent: null };
const cards = withRemovedCards([affected], [removal], 'b');
assert.equal(cards.length, 2);
assert.equal(withRemovedCards([], [removal], 'elsewhere').length, 0);
assert.equal(withRemovedCards([cause], [removal], 'b')[0].deletedAt, undefined);
const history = [{ entityType: 'card', entityId: 'a', group: 'dependencies', createdAt: day(2),
  previousContent: { field: 'cardDependencies', value: [] },
  newContent: { field: 'cardDependencies', value: cause.cardDependencies } }, removal];
const episodes = blockerEpisodes(cards, history, day(10));
assert.equal(episodes.length, 1);
assert.equal(episodes[0].days, 3);
assert.deepEqual(episodes[0].endAt, day(5));
console.log('timeHistory: complete move snapshots, worker bounds, time corrections, retained blockers and board isolation passed');

const { dependencySummary } = require('../models/lib/flowHistory');
assert.equal(dependencySummary([{ cardId: 'c', type: 'blocks' }], () => 'Task', () => 'Blocks'), 'Blocks: Task');
assert.equal(dependencySummary([]), '—');
const restored = timeAdjustments([
  { ...rows[0], userId: 'u', restoredByUserId: 'v' },
  { ...rows[0], userId: 'v', restoredByUserId: 'v' },
]);
assert.equal(restored.entries.length, 1);
assert.equal(restored.groups[0].userId, 'v');
