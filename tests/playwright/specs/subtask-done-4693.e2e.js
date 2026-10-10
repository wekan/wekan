'use strict';

// #4693: tick a subtask done (and untick it) in the parent card's Subtasks
// list, with done/total in the section heading. "Done" is the subtask card's
// dueComplete (models/lib/subtaskDone.js); a comment-only member sees the
// state but cannot change it, and the server refuses them too.

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard, navigateInApp } = require('../helpers/auth');
const CardPage = require('../pages/CardPage');

function makeSubtask(board) {
  const parent = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  const child = db.findOne('cards', { boardId: board.boardId, title: 'Beta Card' });
  db.updateOne('cards', { _id: child._id }, { $set: { parentId: parent._id, parentIds: [parent._id], dueComplete: false } });
  return { parent, child };
}

async function openCard(page, board, cardId) {
  await navigateInApp(page, `/b/${board.boardId}/${board.slug}/${cardId}`);
  await page.waitForFunction(id => Package.session.Session.get('currentCard') === id, cardId);
  const cp = new CardPage(page);
  await cp.waitForOpen();
  return cp;
}

test.describe('Subtask done checkbox (#4693)', () => {
  test('ticking and unticking a subtask updates it and the done/total count', async ({ boardPage, board }) => {
    const { parent, child } = makeSubtask(board);
    const cp = await openCard(boardPage, board, parent._id);
    const heading = cp.root.locator('.js-toggle-card-section[data-section="subtasks"]');
    const row = cp.root.locator('.card-subtasks-items .js-subtasks').filter({ hasText: 'Beta Card' });
    const box = row.locator('.js-toggle-subtask-done');

    await expect(heading).toContainText('(0/1)');
    await expect(box).toHaveAttribute('aria-checked', 'false');

    await box.click();
    await expect.poll(() => db.findOne('cards', { _id: child._id }).dueComplete).toBe(true);
    await expect(box).toHaveAttribute('aria-checked', 'true');
    await expect(row.locator('.subtask-title')).toHaveClass(/is-done/);
    await expect(heading).toContainText('(1/1)');

    await box.click();
    await expect.poll(() => db.findOne('cards', { _id: child._id }).dueComplete).toBe(false);
    await expect(box).toHaveAttribute('aria-checked', 'false');
    await expect(heading).toContainText('(0/1)');
  });

  test('NEGATIVE: a comment-only member sees the state but cannot tick it', async ({ page, user2, board }) => {
    const { parent, child } = makeSubtask(board);
    db.updateOne('cards', { _id: child._id }, { $set: { dueComplete: true } });
    db.updateOne('boards', { _id: board.boardId }, { $push: { members: {
      userId: user2.id, isAdmin: false, isActive: true, isNoComments: false,
      isCommentOnly: true, isWorker: false, isReadOnly: false, isReadAssignedOnly: false } } });
    await loginWithToken(page, user2.id, user2.token);
    await openBoard(page, board.boardId, board.slug);
    const cp = await openCard(page, board, parent._id);
    const row = cp.root.locator('.card-subtasks-items .js-subtasks').filter({ hasText: 'Beta Card' });

    await expect(cp.root.locator('.js-toggle-card-section[data-section="subtasks"]')).toContainText('(1/1)');
    await expect(row.locator('.subtask-done-toggle.is-disabled')).toHaveAttribute('aria-checked', 'true');
    await expect(row.locator('.js-toggle-subtask-done')).toHaveCount(0);

    const refused = await page.evaluate(([p, c]) => Meteor.callAsync('setSubtaskDone', p, c, false)
      .then(() => 'accepted', error => error.error), [parent._id, child._id]);
    expect(refused).toBe('not-authorized');
    expect(db.findOne('cards', { _id: child._id }).dueComplete).toBe(true);
  });
});
