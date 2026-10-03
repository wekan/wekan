'use strict';
// Sprints have no card cap (maintainer decision of 2026-10-03): snapshot rows,
// the rollover plan and the History of a close are kept in bounded chunks
// (server/lib/scrumSnapshotStore.js, server/lib/scrumRolloverStore.js,
// models/lib/scrumHistory.js historyParts). These used to refuse a sprint over
// 10,000 cards and a close whose metadata outgrew one document.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');
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
    // The close returns at once; the cards follow in the background, and the
    // Scrum view shows how far (decision of 2026-10-03).
    const returned = await call(page, 'scrum.closeSprint', board.boardId, sprint._id, active.revision, null);
    expect([returned.state, returned.rolloverPending, returned.rolloverTotal]).toEqual(['closed', true, 10001]);
    await openBoard(page, board.boardId, board.slug);
    await page.locator('.js-toggle-board-view').first().click();
    await page.locator('.pop-over .js-open-sprints-view').click();
    await page.locator('.js-scrum-sprint').selectOption(sprint._id);
    await expect(page.locator('.js-scrum-rollover-progress')).toContainText('of 10001');
    await expect(page.locator('.js-scrum-rollover-progress')).toHaveCount(0, { timeout: 120000 });
    const closed = db.findOne('scrumSprints', { _id: sprint._id });
    expect(closed.state).toBe('closed');
    expect(closed.rolloverPending).toBeUndefined();
    expect(closed.rolloverTotal).toBeUndefined();
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
    // Several rows: the rest of them are undone in the background.
    await call(page, 'changeHistory.undoLast', board.boardId, `undo-${sprint._id}`.replace(/[^A-Za-z0-9_-]/g, '').padEnd(16, 'x'));
    await expect.poll(() => db.findOne('scrumSprints', { _id: sprint._id }).state, { timeout: 120000 }).toBe('active');
    await expect.poll(() => db.findOne('scrumBatchJobs', { _id: board.boardId }), { timeout: 120000 }).toBeFalsy();
    expect(db.find('cards', { ...extra, 'scrum.sprintId': sprint._id }, { _id: 1 })).toHaveLength(800);
  } finally {
    db.deleteMany('cards', extra);
    db.deleteMany('scrumSprints', { boardId: board.boardId });
    db.deleteMany('scrumSnapshotRows', { boardId: board.boardId });
    db.deleteMany('changeHistory', { boardId: board.boardId });
  }
});

test('the Scrum view shows a large undo running in the background, and one that stopped', async ({ page, user, board }) => {
  const base = { _id: board.boardId, boardId: board.boardId, userId: user.id, direction: 'undo', batchId: 'scrum-close-x-1',
    requestId: null, index: 3, startedAt: new Date() };
  try {
    db.insertOne('scrumBatchJobs', { ...base, done: 3, total: 12, state: 'running' });
    await loginWithToken(page, user.id, user.token);
    await openBoard(page, board.boardId, board.slug);
    await page.locator('.js-toggle-board-view').first().click();
    await page.locator('.pop-over .js-open-sprints-view').click();
    const job = page.locator('.js-scrum-history-job');
    await expect(job).toContainText('3 of 12');
    await expect(job.locator('.scrum-progress-bar')).toHaveAttribute('style', /width: 25%/);
    // It moves on without a reload: the view polls while it runs.
    db.updateOne('scrumBatchJobs', { _id: board.boardId }, { $set: { done: 9 } });
    await expect(job).toContainText('9 of 12', { timeout: 15000 });
    db.updateOne('scrumBatchJobs', { _id: board.boardId }, { $set: { state: 'failed', error: 'lost connection' } });
    await expect(job).toContainText('lost connection', { timeout: 15000 });
    await expect(job).toContainText('Press undo or redo again');
  } finally {
    db.deleteMany('scrumBatchJobs', { _id: board.boardId });
  }
});
