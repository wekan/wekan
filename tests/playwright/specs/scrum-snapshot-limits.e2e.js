'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken } = require('../helpers/auth');
const call = (page, method, ...args) => page.evaluate(async ({ method, args }) => {
  try { return await Meteor.callAsync(method, ...args); }
  catch (error) { throw new Error(`${error.error}: ${error.reason || error.message}`); }
}, { method, args });

test('oversized sprint inputs reject start and close without partial snapshots or History', async ({ page, user, board }) => {
  test.setTimeout(120000);
  const extra = { boardId: board.boardId, snapshotLimitFixture: true };
  try {
    await loginWithToken(page, user.id, user.token);
    const sprint = await call(page, 'scrum.saveSprint', board.boardId, null,
      { name: 'Snapshot limits', plannedStart: '2026-09-01', plannedEnd: '2026-09-30' }, null);
    const card = db.find('cards', { boardId: board.boardId })[0];
    await call(page, 'scrum.updateCard', board.boardId, card._id, { sprintId: sprint._id }, 0);
    const before = db.find('changeHistory', { boardId: board.boardId }).length;
    db.insertMany('cards', Array.from({ length: 10001 }, (_, i) => ({ ...extra,
      _id: `${sprint._id}-extra-${i}`, listId: card.listId, archived: false,
      scrum: { sprintId: sprint._id } })));
    await expect(call(page, 'scrum.startSprint', board.boardId, sprint._id, sprint.revision))
      .rejects.toThrow(/snapshot limit/);
    expect(db.findOne('scrumSprints', { _id: sprint._id }).state).toBe('planned');
    expect(db.findOne('scrumSprints', { _id: sprint._id }).startSnapshot).toBeFalsy();
    expect(db.find('changeHistory', { boardId: board.boardId }).length).toBe(before);
    // Start excludes archived cards; close must include them for rollover.
    db.updateMany('cards', extra, { $set: { archived: true } });
    const active = await call(page, 'scrum.startSprint', board.boardId, sprint._id, sprint.revision);
    expect(active.startSnapshot.cards).toHaveLength(1);
    const started = db.find('changeHistory', { boardId: board.boardId }).length;
    await expect(call(page, 'scrum.closeSprint', board.boardId, sprint._id, active.revision, null))
      .rejects.toThrow(/snapshot limit/);
    db.deleteMany('cards', extra);
    db.insertMany('lists', Array.from({ length: 10001 }, (_, i) => ({ ...extra,
      _id: `${sprint._id}-list-${i}`, scrum: { category: 'done' } })));
    await expect(call(page, 'scrum.closeSprint', board.boardId, sprint._id, active.revision, null))
      .rejects.toThrow(/snapshot list limit/);
    const unchanged = db.findOne('scrumSprints', { _id: sprint._id });
    expect(unchanged.state).toBe('active');
    expect(unchanged.closeSnapshot).toBeFalsy();
    expect(unchanged.revision).toBe(active.revision);
    expect(db.find('changeHistory', { boardId: board.boardId }).length).toBe(started);
    expect(db.findOne('cards', { _id: card._id }).scrum.sprintId).toBe(sprint._id);
    db.deleteMany('lists', extra);
    await call(page, 'scrum.closeSprint', board.boardId, sprint._id, active.revision, null);
    expect(db.findOne('scrumSprints', { _id: sprint._id }).closeSnapshot.cards).toHaveLength(1);
  } finally {
    db.deleteMany('cards', extra);
    db.deleteMany('lists', extra);
    db.deleteMany('scrumSprints', { boardId: board.boardId });
  }
});

test('large rollover metadata fails before closing or changing cards and History', async ({ page, user, board }) => {
  test.setTimeout(120000);
  const extra = { boardId: board.boardId, snapshotByteFixture: true };
  try {
    await loginWithToken(page, user.id, user.token);
    const sprint = await call(page, 'scrum.saveSprint', board.boardId, null,
      { name: 'Metadata byte budget', plannedStart: '2026-09-01', plannedEnd: '2026-09-30' }, null);
    const card = db.find('cards', { boardId: board.boardId })[0];
    db.insertMany('cards', Array.from({ length: 800 }, (_, i) => ({ ...extra,
      _id: `${sprint._id}-bytes-${i}`, listId: card.listId, archived: false,
      scrum: { sprintId: sprint._id, acceptanceCriteria: 'x'.repeat(10000) } })));
    const active = await call(page, 'scrum.startSprint', board.boardId, sprint._id, sprint.revision);
    expect(active.startSnapshot.cards).toHaveLength(800);
    const historyCount = db.find('changeHistory', { boardId: board.boardId }).length;
    await expect(call(page, 'scrum.closeSprint', board.boardId, sprint._id, active.revision, null))
      .rejects.toThrow(/document size budget/);
    expect(db.findOne('scrumSprints', { _id: sprint._id }).state).toBe('active');
    expect(db.findOne('scrumSprints', { _id: sprint._id }).revision).toBe(active.revision);
    expect(db.find('changeHistory', { boardId: board.boardId }).length).toBe(historyCount);
    expect(db.find('cards', { ...extra, 'scrum.sprintId': sprint._id }, { _id: 1 })).toHaveLength(800);
    db.updateMany('cards', extra, { $set: { 'scrum.acceptanceCriteria': '' } });
    await call(page, 'scrum.closeSprint', board.boardId, sprint._id, active.revision, null);
    expect(db.findOne('scrumSprints', { _id: sprint._id }).state).toBe('closed');
    expect(db.find('cards', { ...extra, 'scrum.sprintId': sprint._id }, { _id: 1 })).toHaveLength(0);
  } finally {
    db.deleteMany('cards', extra);
    db.deleteMany('scrumSprints', { boardId: board.boardId });
  }
});
