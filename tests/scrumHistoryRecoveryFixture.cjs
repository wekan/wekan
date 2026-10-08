'use strict';
// One board with a Scrum History checkpoint, in the shapes
// server/lib/scrumHistory.js writes: the History row "created sprint s1 and put
// card c1 in it", and an undo (or redo) of it that wrote some of its records.
// Shared by tests/scrumHistoryRecovery.test.cjs (no database) and
// tests/integration/scrumHistoryRecovery.test.cjs (MongoDB).
const { hashHistoryRow } = require('../models/lib/changeHistoryIntegrity');

const createdAt = new Date('2026-10-01T08:00:00.000Z');
const sprintContent = { _id: 's1', boardId: 'b', name: 'Sprint one', state: 'planned', createdAt };
const cardDocument = scrum => ({ _id: 'c1', boardId: 'b', scrum });
const previousContent = { records: [{ type: 'card', id: 'c1', document: cardDocument({}) },
  { type: 'scrum-sprint', id: 's1', document: null }] };
const newContent = { records: [{ type: 'card', id: 'c1', document: cardDocument({ sprintId: 's1' }) },
  { type: 'scrum-sprint', id: 's1', document: sprintContent }] };

function scrumHistoryFixture({ direction = 'undo', applied = [], conflict = null, lastFailure = null, damagedRow = false,
  authorRemoved = false, malformed = false, restoredRow = false, operationId = 'op', resolving = null, job = null } = {}) {
  const undo = direction === 'undo';
  const row = { _id: 'row', boardId: 'b', swimlaneId: null, listId: null, cardId: null, entityType: 'scrum', entityId: 'b',
    group: 'scrum', changeType: 'edited', previousContent, newContent, userId: 'author', createdAt, batchId: null,
    restoredFromId: null, restoredByUserId: null, previousHash: null, undone: !undo, superseded: false };
  row.integrityHash = damagedRow ? 'f'.repeat(64) : hashHistoryRow(row);
  const cardScrum = { pending: undo ? { sprintId: 's1' } : {}, applied: undo ? {} : { sprintId: 's1' } };
  const card = { _id: 'c1', boardId: 'b', title: 'Keep this title', listId: 'l1', swimlaneId: 'w1', assignees: [] };
  if (conflict === 'card') Object.assign(card, { scrum: { sprintId: 'elsewhere' }, scrumRevision: 9 });
  else if (applied.includes('card')) Object.assign(card, { scrum: cardScrum.applied, scrumRevision: 4 });
  else Object.assign(card, { scrum: cardScrum.pending, scrumRevision: 3 });
  const sprints = [];
  if (conflict === 'sprint') {
    sprints.push({ ...sprintContent, name: 'Renamed by someone else', revision: 7, incarnation: undo ? 'inc1' : 'other' });
  } else if (undo ? !applied.includes('sprint') : applied.includes('sprint')) {
    sprints.push({ ...sprintContent, revision: undo ? 2 : 1, incarnation: 'inc1', updatedAt: createdAt, updatedBy: 'author' });
  }
  const checkpoint = { _id: 'b', rowId: 'row', direction, userId: 'author', ...(operationId ? { operationId } : {}),
    content: undo ? previousContent : newContent, before: undo ? newContent : previousContent,
    revisions: malformed ? [3] : undo ? [3, 2] : [3, null],
    incarnations: [{ before: null, after: null }, undo ? { before: 'inc1', after: null } : { before: null, after: 'inc1' }],
    worker: 'author-worker',
    ...(lastFailure ? { lastFailure: { error: lastFailure, at: createdAt, reason: 'Scrum data changed.' } } : {}),
    ...(resolving ? { resolving } : {}) };
  const history = [row];
  if (restoredRow) history.push({ _id: 'restored', boardId: 'b', batchId: operationId, changeType: 'restored', userId: 'author' });
  return {
    row, checkpoint,
    collections: {
      boards: [{ _id: 'b', title: 'Scrum board', members: [{ userId: 'author', isActive: true, isAdmin: false },
        { userId: 'admin', isActive: true, isAdmin: true }] }],
      users: authorRemoved ? [{ _id: 'admin' }] : [{ _id: 'author' }, { _id: 'admin' }],
      cards: [card], scrumSprints: sprints, changeHistory: history, scrumHistoryPending: [checkpoint],
      scrumBatchJobs: job ? [{ _id: 'b', boardId: 'b', batchId: 'batch', index: 1, done: 1, total: 9, ...job }] : [],
    },
  };
}
module.exports = { scrumHistoryFixture };
