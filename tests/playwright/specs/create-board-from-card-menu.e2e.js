'use strict';
// Card menu / Create board from this card: shown to a member who can edit the
// card - it sat under `unless canModifyCard`, so exactly they never saw it - and
// still not to a read-only member.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const { loginWithToken, openBoard } = require('../helpers/auth');

async function openCardMenu(page, board) {
  await new BoardPage(page).clickCard(board.listIds[0], 'Alpha Card');
  await page.locator('.card-details .js-open-card-details-menu').first().click();
  return page.locator('.pop-over');
}

test('a member who can edit the card sees Create board from this card', async ({ boardPage, board }) => {
  const menu = await openCardMenu(boardPage, board);
  await expect(menu.locator('.js-copy-card-link')).toBeVisible();
  await expect(menu.locator('.js-create-board-from-card')).toBeVisible();
  await menu.locator('.js-create-board-from-card').click();
  await expect(boardPage.locator('.js-create-board-from-card-form')).toBeVisible();
});

test('negative: a read-only member does not see it', async ({ boardPage, board, user2 }) => {
  db.updateOne('boards', { _id: board.boardId }, { $push: { members: {
    userId: user2.id, isAdmin: false, isActive: true, isNoComments: false,
    isCommentOnly: false, isWorker: false, isNormalAssignedOnly: false,
    isCommentAssignedOnly: false, isReadOnly: true, isReadAssignedOnly: false,
  } } });
  await loginWithToken(boardPage, user2.id, user2.token);
  await openBoard(boardPage, board.boardId, board.slug);
  const menu = await openCardMenu(boardPage, board);
  await expect(menu.locator('.js-copy-card-link')).toBeVisible();
  await expect(menu.locator('.js-create-board-from-card')).toHaveCount(0);
});
