'use strict';
// #2076: a "moved forward" trigger fires when a card moves to a later list,
// and not when it moves back.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');

const headers = token => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' });

test('a moved-forward rule colours a card moved to a later list, not one moved back', async ({ boardPage: page, request, user, board }) => {
  const [first, second] = board.listIds;
  try {
    await page.evaluate(async boardId => Meteor.callAsync('rules.createRule', boardId, '',
      { activityType: 'moveCardDirection', boardId, direction: 'forward', cardTitle: '*', desc: 'moved forward' },
      { actionType: 'setColor', selectedColor: 'red', boardId, desc: 'set color red' }), board.boardId);
    await expect.poll(() => db.find('rules', { boardId: board.boardId }).length).toBe(1);
    const alpha = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
    const beta = db.findOne('cards', { boardId: board.boardId, title: 'Beta Card' });
    const forward = await request.put(`/api/boards/${board.boardId}/lists/${first}/cards/${alpha._id}`,
      { headers: headers(user.token), data: { listId: second } });
    expect(forward.status()).toBe(200);
    await expect.poll(() => db.findOne('cards', { _id: alpha._id }).color, { timeout: 15_000 }).toBe('red');
    const back = await request.put(`/api/boards/${board.boardId}/lists/${second}/cards/${beta._id}`,
      { headers: headers(user.token), data: { listId: first } });
    expect(back.status()).toBe(200);
    await page.waitForTimeout(2000);
    expect(db.findOne('cards', { _id: beta._id }).color || null).not.toBe('red');
  } finally {
    db.deleteMany('rules', { boardId: board.boardId });
    db.deleteMany('triggers', { boardId: board.boardId });
    db.deleteMany('actions', { boardId: board.boardId });
  }
});
