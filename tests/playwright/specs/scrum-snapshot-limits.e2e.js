'use strict';
// Sprints have no card cap (maintainer decision of 2026-10-03): snapshot rows,
// the rollover plan and the History of a close are kept in bounded chunks
// (server/lib/scrumSnapshotStore.js, server/lib/scrumRolloverStore.js,
// models/lib/scrumHistory.js historyParts). These used to refuse a sprint over
// 10,000 cards and a close whose metadata outgrew one document.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken } = require('../helpers/auth');
const call = (page, method, ...args) => page.evaluate(async ({ method, args }) => {
  try { return await Meteor.callAsync(method, ...args); }
  catch (error) { throw new Error(`${error.error}: ${error.reason || error.message}`); }
}, { method, args });

test('a sprint past the old 10,000-card limit starts and closes, with its rows outside the sprint', async ({ page, user, board }) => {
  test.setTimeout(300000);
  const extra = { boardId: board.boardId, snapshotLimitFixture: true };
  try {
    await loginWithToken(page, user.id, user.token);
    const sprint = await call(page, 'scrum.saveSprint', board.boardId, null,
      { name: 'Large sprint', plannedStart: '2026-09-01', plannedEnd: '2026-09-30' }, null);
    const card = db.find('cards', { boardId: board.boardId })[0];
    db.insertMany('cards', Array.from({ length: 10001 }, (_, i) => ({ ...extra,
      _id: `${sprint._id}-extra-${i}`, listId: card.listId, swimlaneId: card.swimlaneId, archived: false,
      dueComplete: i % 2 === 0, scrum: { sprintId: sprint._id } })));
    const active = await call(page, 'scrum.startSprint', board.boardId, sprint._id, sprint.revision);
    expect(active.startSnapshot.rowCount).toBe(10001);
    expect(active.startSnapshot.cards).toBeUndefined();
    const stored = db.findOne('scrumSprints', { _id: sprint._id });
    expect(stored.startSnapshot.stored).toBe('rows');
    expect(db.find('scrumSnapshotRows', { sprintId: sprint._id, kind: 'start' }, { _id: 1 }).length).toBe(6);
    await call(page, 'scrum.closeSprint', board.boardId, sprint._id, active.revision, null);
    const closed = db.findOne('scrumSprints', { _id: sprint._id });
    expect(closed.state).toBe('closed');
    expect(closed.rolloverPending).toBeUndefined();
    expect(db.find('scrumRolloverRows', { sprintId: sprint._id }, { _id: 1 })).toHaveLength(0);
    expect(db.find('cards', { ...extra, 'scrum.sprintId': sprint._id }, { _id: 1 })).toHaveLength(0);
    // The board data carries the report, never the rows.
    const data = await call(page, 'scrum.getBoardData', board.boardId);
    const sent = data.sprints.find(row => row._id === sprint._id);
    expect(sent.report.committed.count).toBe(10001);
    expect(sent.closeSnapshot.cards).toBeUndefined();
    expect(sent.reportTotals).toBeUndefined();
  } finally {
    db.deleteMany('cards', extra);
    db.deleteMany('scrumSprints', { boardId: board.boardId });
    db.deleteMany('scrumSnapshotRows', { boardId: board.boardId });
  }
});

test('a close whose card metadata outgrows one document is recorded in bounded History rows', async ({ page, user, board }) => {
  test.setTimeout(300000);
  const extra = { boardId: board.boardId, snapshotByteFixture: true };
  try {
    await loginWithToken(page, user.id, user.token);
    const sprint = await call(page, 'scrum.saveSprint', board.boardId, null,
      { name: 'Metadata byte budget', plannedStart: '2026-09-01', plannedEnd: '2026-09-30' }, null);
    const card = db.find('cards', { boardId: board.boardId })[0];
    db.insertMany('cards', Array.from({ length: 800 }, (_, i) => ({ ...extra,
      _id: `${sprint._id}-bytes-${i}`, listId: card.listId, swimlaneId: card.swimlaneId, archived: false,
      scrum: { sprintId: sprint._id, acceptanceCriteria: 'x'.repeat(10000) } })));
    const active = await call(page, 'scrum.startSprint', board.boardId, sprint._id, sprint.revision);
    expect(active.startSnapshot.rowCount).toBe(800);
    await call(page, 'scrum.closeSprint', board.boardId, sprint._id, active.revision, null);
    expect(db.findOne('scrumSprints', { _id: sprint._id }).state).toBe('closed');
    expect(db.find('cards', { ...extra, 'scrum.sprintId': sprint._id }, { _id: 1 })).toHaveLength(0);
    // About 16 MB of metadata on each side: several rows of one batch.
    const rows = db.find('changeHistory', { boardId: board.boardId, entityType: 'scrum', batchId: { $ne: null }, isCheckpoint: { $ne: true } });
    expect(rows.length).toBeGreaterThan(1);
    expect(new Set(rows.map(row => row.batchId)).size).toBe(1);
    // One undo reverses the whole close.
    await call(page, 'changeHistory.undoLast', board.boardId, `undo-${sprint._id}`.replace(/[^A-Za-z0-9_-]/g, '').padEnd(16, 'x'));
    expect(db.findOne('scrumSprints', { _id: sprint._id }).state).toBe('active');
    expect(db.find('cards', { ...extra, 'scrum.sprintId': sprint._id }, { _id: 1 })).toHaveLength(800);
  } finally {
    db.deleteMany('cards', extra);
    db.deleteMany('scrumSprints', { boardId: board.boardId });
    db.deleteMany('scrumSnapshotRows', { boardId: board.boardId });
    db.deleteMany('changeHistory', { boardId: board.boardId });
  }
});
