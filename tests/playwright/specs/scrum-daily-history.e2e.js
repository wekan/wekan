'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken } = require('../helpers/auth');
const call = (page, method, ...args) => page.evaluate(({ method, args }) => Meteor.callAsync(method, ...args), { method, args });

test('daily Scrum observations retain measured estimates and obey assigned-card access', async ({ page, browser, user, user2, board }) => {
  const cards = db.find('cards', { boardId: board.boardId });
  const secondContext = await browser.newContext();
  const second = await secondContext.newPage();
  try {
    await loginWithToken(page, user.id, user.token);
    await loginWithToken(second, user2.id, user2.token);
    const sprint = await call(page, 'scrum.saveSprint', board.boardId, null,
      { name: 'Daily history', plannedStart: '2026-09-01', plannedEnd: '2026-09-30' }, null);
    db.updateOne('cards', { _id: cards[0]._id }, { $set: { 'poker.estimation': 3, assignees: [user2.id] } });
    db.updateOne('cards', { _id: cards[1]._id }, { $set: { 'poker.estimation': 999 } });
    for (const card of cards) await call(page, 'scrum.updateCard', board.boardId, card._id, { sprintId: sprint._id }, 0);
    await call(page, 'scrum.startSprint', board.boardId, sprint._id, sprint.revision);
    const history = await call(page, 'scrum.getDailyHistory', board.boardId, sprint._id);
    expect(history.rows).toHaveLength(1);
    expect(history.rows[0]).toMatchObject({ consistency: 'observed', scope: { count: 3, estimate: 1002, unknown: 1 } });
    db.updateOne('cards', { _id: cards[0]._id }, { $set: { 'poker.estimation': 8, dueComplete: true } });
    const retry = await call(page, 'scrum.getDailyHistory', board.boardId, sprint._id);
    expect(retry.rows).toEqual(history.rows);
    expect(db.find('scrumDailySnapshots', { boardId: board.boardId })).toHaveLength(1);
    const denied = await second.evaluate(async ({ boardId, sprintId }) => {
      try { await Meteor.callAsync('scrum.getDailyHistory', boardId, sprintId); return 'accepted'; }
      catch (error) { return error.error; }
    }, { boardId: board.boardId, sprintId: sprint._id });
    expect(denied).toBe('not-authorized');
    db.updateOne('boards', { _id: board.boardId }, { $push: { members: {
      userId: user2.id, isActive: true, isAdmin: false, isReadAssignedOnly: true,
    } } });
    const restricted = await call(second, 'scrum.getDailyHistory', board.boardId, sprint._id);
    expect(restricted.partial).toBe(true);
    expect(restricted.rows[0].scope).toEqual({ count: 1, estimate: 3, unknown: 0 });
    expect(restricted.rows[0].remaining.estimate).toBe(3);
    expect(JSON.stringify(restricted)).not.toContain('999');
  } finally {
    await secondContext.close();
    db.deleteMany('scrumDailySnapshots', { boardId: board.boardId });
    db.deleteMany('scrumSprints', { boardId: board.boardId });
  }
});

test('daily history streams a bounded recent window and labels truncation', async ({ page, user, board }) => {
  const sprintId = `daily-window-${board.boardId}`;
  const end = new Date();
  const start = new Date(end.getTime() - 367 * 86400000);
  const policy = { at: start, estimateSource: 'poker', completionPolicy: 'dueComplete', unit: 'points', cards: [] };
  db.insertOne('scrumSprints', { _id: sprintId, boardId: board.boardId, name: 'History window', state: 'closed', startSnapshot: policy });
  db.insertMany('scrumDailySnapshots', Array.from({ length: 367 }, (_, index) => {
    const capturedAt = new Date(start.getTime() + (index + 1) * 86400000);
    return { _id: `${sprintId}-${index}`, boardId: board.boardId, sprintId,
      startedAt: start, capturedAt, day: capturedAt.toISOString().slice(0, 10), snapshot: { ...policy, at: capturedAt } };
  }));
  try {
    await loginWithToken(page, user.id, user.token);
    const result = await call(page, 'scrum.getDailyHistory', board.boardId, sprintId);
    expect(result.truncated).toBe(true);
    expect(result.rows).toHaveLength(366);
    expect(result.rows[0].day).toBe(new Date(start.getTime() + 2 * 86400000).toISOString().slice(0, 10));
    expect(result.rows.at(-1).day).toBe(end.toISOString().slice(0, 10));
  } finally {
    db.deleteMany('scrumDailySnapshots', { boardId: board.boardId });
    db.deleteMany('scrumSprints', { boardId: board.boardId });
  }
});
