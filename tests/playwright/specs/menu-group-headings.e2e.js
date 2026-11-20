'use strict';
// The list and card menus are grouped under headings (2026-11-20); a member
// who sees none of a group sees no heading over it.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const { loginWithToken, openBoard } = require('../helpers/auth');
const en = require('../../../imports/i18n/data/en.i18n.json');

test('the list and card menus show their group headings', async ({ boardPage: page, board }) => {
  await page.locator('.js-open-list-menu').first().click();
  const list = page.locator('.pop-over');
  await expect(list.locator('.menu-group-heading').first()).toHaveText(en['menu-group-share']);
  await expect(list.locator('.menu-group-heading', { hasText: en['menu-group-move-copy'] })).toBeVisible();
  await page.evaluate(() => Popup.close());
  await new BoardPage(page).clickCard(board.listIds[0], 'Alpha Card');
  await page.locator('.card-details .js-open-card-details-menu').first().click();
  const card = page.locator('.pop-over');
  await expect(card.locator('.menu-group-heading').first()).toHaveText(en['menu-group-move-copy']);
  await expect(card.locator('.menu-group-heading', { hasText: en['menu-group-share'] })).toBeVisible();
});

test('negative: a read-only member has no Move and copy heading over nothing', async ({ page, board, user2 }) => {
  db.updateOne('boards', { _id: board.boardId }, { $push: { members: {
    userId: user2.id, isAdmin: false, isActive: true, isNoComments: false, isCommentOnly: false, isWorker: false,
    isNormalAssignedOnly: false, isCommentAssignedOnly: false, isReadOnly: true, isReadAssignedOnly: false,
  } } });
  await loginWithToken(page, user2.id, user2.token);
  await openBoard(page, board.boardId, board.slug);
  await new BoardPage(page).clickCard(board.listIds[0], 'Alpha Card');
  await page.locator('.card-details .js-open-card-details-menu').first().click();
  const card = page.locator('.pop-over');
  await expect(card.locator('.menu-group-heading', { hasText: en['menu-group-share'] })).toBeVisible();
  await expect(card.locator('.menu-group-heading', { hasText: en['menu-group-move-copy'] })).toHaveCount(0);
});
