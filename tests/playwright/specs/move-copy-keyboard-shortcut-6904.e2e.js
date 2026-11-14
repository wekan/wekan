'use strict';

/**
 * #6904 - Shift+M opens Move card and Shift+C opens Copy card for the opened
 * card, through the card's own hamburger menu, only when the user has keyboard
 * shortcuts enabled, is not typing in a field, and the menu offers the action.
 * tests/cardMenuKeyboardShortcut.test.cjs drives the DOM logic.
 */

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

const picker = page => page.locator('.js-pop-over').filter({ has: page.locator('select.js-select-lists') });

async function openAlphaCard(page, who, board, shortcutsOn) {
  // Seeded users have keyboard shortcuts switched off in their profile.
  db.updateOne('users', { _id: who.id }, { $set: { 'profile.keyboardShortcuts': shortcutsOn } });
  await loginWithToken(page, who.id, who.token);
  await openBoard(page, board.boardId, board.slug);
  const cp = new CardPage(page);
  await new BoardPage(page).clickCard(board.listIds[0], 'Alpha Card');
  await cp.waitForOpen();
  // Leave no link or button focused: shortcuts deliberately skip those.
  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  return cp;
}

test.describe('#6904 Move and Copy card keyboard shortcuts', () => {
  test('Shift+M opens Move card and Shift+C opens Copy card, and both are listed', async ({ page, user, board }) => {
    await openAlphaCard(page, user, board, true);
    await page.keyboard.press('Shift+M');
    await expect(picker(page)).toBeVisible({ timeout: 8_000 });
    await expect(picker(page).locator('#move-card-title')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(picker(page)).toHaveCount(0);

    await page.evaluate(() => document.activeElement && document.activeElement.blur());
    await page.keyboard.press('Shift+C');
    await expect(picker(page)).toBeVisible({ timeout: 8_000 });
    await expect(picker(page).locator('#copy-card-title')).toBeVisible();
    await page.keyboard.press('Escape');

    // The plain keys keep their own actions: c is not Copy card.
    const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
    expect(db.getCard(card._id).archived).not.toBe(true);

    await page.goto('/shortcuts');
    const items = page.locator('.shortcuts-list-item');
    await expect(items.filter({ hasText: 'Move Card' })).toHaveCount(1);
    await expect(items.filter({ hasText: 'Copy Card' })).toHaveCount(1);
  });

  test('negative: nothing opens when keyboard shortcuts are disabled', async ({ page, user, board }) => {
    await openAlphaCard(page, user, board, false);
    await page.keyboard.press('Shift+M');
    await page.keyboard.press('Shift+C');
    await page.waitForTimeout(800);
    await expect(picker(page)).toHaveCount(0);
  });

  test('negative: typing M in the card title does not open Move card', async ({ page, user, board }) => {
    const cp = await openAlphaCard(page, user, board, true);
    await cp.root.locator('.js-card-title .js-open-inlined-form, .card-details-title-edit-zone').first().click();
    const title = cp.root.locator('.js-card-details-title textarea, .js-card-details-title input').first();
    await title.focus();
    await title.evaluate(el => el.setSelectionRange(el.value.length, el.value.length));
    await page.keyboard.type('MC');
    await page.waitForTimeout(500);
    await expect(picker(page)).toHaveCount(0);
    await expect(title).toHaveValue(/MC$/);
  });

  test('negative: a member who is not a board admin gets no Move card, and no menu is left open', async ({ page, user2, board }) => {
    db.addBoardMember({ boardId: board.boardId, userId: user2.id, isAdmin: false });
    await openAlphaCard(page, user2, board, true);
    await page.keyboard.press('Shift+M');
    await page.waitForTimeout(1500);
    await expect(picker(page)).toHaveCount(0);
    await expect(page.locator('.js-pop-over')).toHaveCount(0);
    // Copy card is in their menu, so Shift+C still opens it.
    await page.evaluate(() => document.activeElement && document.activeElement.blur());
    await page.keyboard.press('Shift+C');
    await expect(picker(page)).toBeVisible({ timeout: 8_000 });
  });
});
