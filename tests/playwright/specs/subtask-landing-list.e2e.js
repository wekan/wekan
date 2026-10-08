'use strict';
// #1781: each main board lands its subtasks in the list it chose on a shared
// deposit board (Board Settings / Subtasks shows that board's lists), and a
// subtask never gets a list of another board.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');

test('a subtask lands in the list the main board chose on its deposit board', async ({ boardPage: page, user, board }) => {
  const deposit = db.seedBoard({ ownerId: user.id, title: 'Shared deposit', listCount: 3 });
  const [, chosen, depositOwn] = deposit.listIds;
  // The deposit board's own landing list differs from the main board's choice.
  db.updateOne('boards', { _id: deposit.boardId }, { $set: { subtasksDefaultListId: depositOwn } });
  db.updateOne('boards', { _id: board.boardId }, { $set: { allowsSubtasks: true,
    subtasksDefaultBoardId: deposit.boardId, subtasksDefaultListId: chosen } });
  try {
    const parent = db.find('cards', { boardId: board.boardId })[0];
    await page.evaluate(id => Meteor.callAsync('addSubtaskCard', id, 'Landing test subtask', false), parent._id);
    await expect.poll(() => db.find('cards', { boardId: deposit.boardId, title: 'Landing test subtask' }).length, { timeout: 15_000 }).toBe(1);
    const subtask = db.find('cards', { boardId: deposit.boardId, title: 'Landing test subtask' })[0];
    expect(subtask.listId).toBe(chosen);
    expect(db.find('lists', { _id: subtask.listId })[0].boardId).toBe(deposit.boardId);
  } finally {
    db.cleanup({ boardIds: [deposit.boardId] });
  }
});
