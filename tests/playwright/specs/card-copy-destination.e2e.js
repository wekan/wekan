'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken } = require('../helpers/auth');

async function copy(page, card, boardId, swimlaneId, listId) {
  return page.evaluate(async args => {
    try { return { id: await Meteor.callAsync('copyCard', ...args) }; }
    catch (error) { return { error: error.error }; }
  }, [card._id, boardId, swimlaneId, listId, false, {}]);
}

test('copy refuses foreign or missing destination containers without writes', async ({ page, user, user2, board }) => {
  const foreign = db.seedBoard({ ownerId: user2.id });
  try {
    const source = db.find('cards', { boardId: board.boardId })[0];
    const foreignList = db.find('lists', { boardId: foreign.boardId })[0];
    await loginWithToken(page, user.id, user.token);
    const before = db.countDocuments('cards', { boardId: board.boardId });
    const number = db.findOne('counters', { _id: `cardNumber-${board.boardId}` });
    const activities = db.countDocuments('activities', { boardId: board.boardId });
    for (const [lane, list] of [[board.swimlaneId, foreignList._id], [foreign.swimlaneId, source.listId],
      [board.swimlaneId, 'missing-list'], ['missing-lane', source.listId]]) {
      const result = await copy(page, source, board.boardId, lane, list);
      expect(result.error).toBe('invalid-copy-destination');
      expect(db.countDocuments('cards', { boardId: board.boardId })).toBe(before);
      const response = await page.request.post(`/api/boards/${board.boardId}/lists/${source.listId}/cards/${source._id}/copy`, {
        headers: { Authorization: `Bearer ${user.token}` },
        data: { toSwimlaneId: lane, toListId: list },
      });
      expect(response.status()).toBe(400);
      expect(db.countDocuments('cards', { boardId: board.boardId })).toBe(before);
    }
    for (const [collection, id] of [['lists', source.listId], ['swimlanes', board.swimlaneId]]) {
      db.updateOne(collection, { _id: id }, { $set: { deletedAt: new Date() } });
      try { expect((await copy(page, source, board.boardId, board.swimlaneId, source.listId)).error).toBe('invalid-copy-destination'); }
      finally { db.updateOne(collection, { _id: id }, { $unset: { deletedAt: '' } }); }
    }
    expect(db.findOne('counters', { _id: `cardNumber-${board.boardId}` })).toEqual(number);
    expect(db.countDocuments('activities', { boardId: board.boardId })).toBe(activities);
    expect(db.findOne('users', { _id: user.id }).loginDisabled).not.toBe(true);
  } finally { db.cleanup({ boardIds: [foreign.boardId] }); }
});

test('cross-board copies accept real destination containers, including board-wide lists', async ({ page, user, board }) => {
  const target = db.seedBoard({ ownerId: user.id });
  try {
    const source = db.find('cards', { boardId: board.boardId })[0];
    const list = db.find('lists', { boardId: target.boardId })[0];
    db.updateOne('lists', { _id: list._id }, { $set: { swimlaneId: '' } });
    await loginWithToken(page, user.id, user.token);
    const result = await copy(page, source, target.boardId, target.swimlaneId, list._id);
    expect(result.error).toBeUndefined();
    expect(db.findOne('cards', { _id: result.id })).toMatchObject({ boardId: target.boardId, swimlaneId: target.swimlaneId, listId: list._id });
    const response = await page.request.post(`/api/boards/${board.boardId}/lists/${source.listId}/cards/${source._id}/copy`, {
      headers: { Authorization: `Bearer ${user.token}` },
      data: { toBoardId: target.boardId, toSwimlaneId: target.swimlaneId, toListId: list._id },
    });
    expect(response.ok()).toBe(true);
    expect(db.find('cards', { boardId: target.boardId })).toHaveLength(2);
  } finally { db.cleanup({ boardIds: [target.boardId] }); }
});
