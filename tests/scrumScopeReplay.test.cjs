'use strict';
// Event-level sprint scope and burndown replayed from History
// (models/lib/scrumScopeReplay.js). Run: node tests/scrumScopeReplay.test.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { replaySprintScope, changesOf } = require('../models/lib/scrumScopeReplay');
const { diffFields } = require('../models/lib/changeHistoryGroups');
const { positionChange } = require('../models/lib/timeHistory');
const { historySide } = require('../models/lib/scrumHistory');
const { sprintSnapshot } = require('../models/lib/scrum');

const settings = { estimateSource: 'customField', estimateCustomFieldId: 'pts', estimateUnit: 'points',
  completionPolicy: 'dueComplete' };
const at = minutes => new Date(Date.UTC(2026, 9, 1, 9, minutes));
// History rows as the hooks write them.
const field = (cardId, name, before, after, minutes) => diffFields('card', { [name]: before }, { [name]: after }, [name])
  .map(change => ({ entityType: 'card', entityId: cardId, cardId, group: change.group, createdAt: at(minutes),
    previousContent: change.previousContent, newContent: change.newContent }))[0];
const scrumRow = (cardId, before, after, minutes) => ({ entityType: 'scrum', group: 'scrum', cardId, createdAt: at(minutes),
  ...Object.fromEntries(['previousContent', 'newContent'].map((key, i) => [key, historySide([{ type: 'card', id: cardId,
    before: { _id: cardId, boardId: 'b', scrum: before }, after: { _id: cardId, boardId: 'b', scrum: after } }],
  i ? 'after' : 'before')])) });
const est = value => [{ _id: 'pts', value }];

// A sprint started at 9:00 with A (3) and B (5). At 9:10 C (2) joins, at 9:20
// B's estimate becomes 8, at 9:30 A is done, at 9:40 C leaves.
function fixture() {
  const startCards = [{ _id: 'A', customFields: est(3), listId: 'l', scrum: { sprintId: 's' } },
    { _id: 'B', customFields: est(5), listId: 'l', scrum: { sprintId: 's' } }];
  const sprint = { _id: 's', startedAt: at(0), startSnapshot: sprintSnapshot(startCards, settings, [], at(0)) };
  // Now: A done, B 8, C out of the sprint again.
  const cards = [{ _id: 'A', customFields: est(3), dueComplete: true, listId: 'l', scrum: { sprintId: 's' } },
    { _id: 'B', customFields: est(8), listId: 'l', scrum: { sprintId: 's' } },
    { _id: 'C', customFields: est(2), listId: 'l', scrum: {} }];
  const rows = [scrumRow('C', {}, { sprintId: 's' }, 10), field('B', 'customFields', est(5), est(8), 20),
    field('A', 'dueComplete', false, true, 30), scrumRow('C', { sprintId: 's' }, {}, 40)];
  return { sprint, cards, rows };
}

test('every recorded change since the start, replayed into scope and burndown', () => {
  const { sprint, cards, rows } = fixture();
  const result = replaySprintScope({ sprint, cards, rows, now: at(50) });
  assert.deepEqual(result.points.map(p => [p.at.getUTCMinutes(), p.scope, p.completed, p.remaining, p.cards, p.cause]), [
    [0, 8, 0, 8, 2, 'start'], [10, 10, 0, 10, 3, 'scrum'], [20, 13, 0, 13, 3, 'customFields'],
    [30, 13, 3, 10, 3, 'dates'], [40, 11, 3, 8, 2, 'scrum']]);
  assert.equal(result.consistent, true, 'the replayed start is the start snapshot');
  assert.equal(result.unit, 'points');
});

test('negative: History missing a write is reported, not presented as fact', () => {
  const { sprint, cards, rows } = fixture();
  // B's estimate change was written with recording off: no row for it.
  const result = replaySprintScope({ sprint, cards, rows: rows.filter(row => row.group !== 'customFields'), now: at(50) });
  assert.equal(result.consistent, false);
  assert.deepEqual(result.inconsistentAt, ['start']);
  // A whole-value row still reconstructs the start; a write History never saw
  // shows against the cards as they are now.
  const drifted = cards.map(card => (card._id === 'B' ? { ...card, customFields: est(1) } : card));
  assert.deepEqual(replaySprintScope({ sprint, cards: drifted, rows, now: at(50) }).inconsistentAt, ['now']);
  // A closed sprint is also checked against its close snapshot.
  const closed = { ...sprint, completedAt: at(45), closeSnapshot: sprintSnapshot(
    [{ _id: 'A', customFields: est(3), dueComplete: true, scrum: { sprintId: 's' } },
      { _id: 'B', customFields: est(9), scrum: { sprintId: 's' } }], settings, [], at(45)) };
  assert.deepEqual(replaySprintScope({ sprint: closed, cards, rows, now: at(50) }).inconsistentAt, ['close']);
  // Rows after the close are not the sprint's.
  const after = replaySprintScope({ sprint: { ...closed, closeSnapshot: sprintSnapshot(
    [{ _id: 'A', customFields: est(3), dueComplete: true }, { _id: 'B', customFields: est(8) }], settings, [], at(45)) },
  cards, rows: [...rows, field('B', 'customFields', est(8), est(1), 47)], now: at(50) });
  assert.equal(after.points.at(-1).scope, 11);
  assert.equal(replaySprintScope({ sprint: { _id: 's' }, cards, rows }), null, 'not started: nothing to replay');
});

test('done lists, poker estimates, archiving and unknown estimates', () => {
  const poker = { ...settings, estimateSource: 'poker', estimateCustomFieldId: null, completionPolicy: 'doneLists' };
  const start = [{ _id: 'A', poker: { estimation: 2 }, listId: 'todo', scrum: { sprintId: 's' } },
    { _id: 'B', listId: 'todo', scrum: { sprintId: 's' } }];
  const sprint = { _id: 's', startedAt: at(0), startSnapshot: sprintSnapshot(start, poker, [], at(0)) };
  const move = { entityType: 'card', entityId: 'A', group: 'position', createdAt: at(5),
    ...positionChange({ boardId: 'b', listId: 'todo' }, { boardId: 'b', listId: 'done' }, ['listId']) };
  const archive = field('B', 'archived', false, true, 8);
  const cards = [{ _id: 'A', poker: { estimation: 2 }, listId: 'done', scrum: { sprintId: 's' } },
    { _id: 'B', listId: 'todo', archived: true, scrum: { sprintId: 's' } }];
  const result = replaySprintScope({ sprint, cards, rows: [move, archive], doneListIds: ['done'], now: at(10) });
  assert.deepEqual(result.points.map(p => [p.scope, p.completed, p.unknown, p.cards]),
    [[2, 0, 1, 2], [2, 2, 1, 2], [2, 2, 0, 1]]);
  assert.equal(result.consistent, true);
  assert.deepEqual(changesOf({ group: 'title', entityType: 'card', entityId: 'A', createdAt: at(1),
    newContent: { field: 'title', value: 'x' } }), [], 'other fields are not scope');
});
