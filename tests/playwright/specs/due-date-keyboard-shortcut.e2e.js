'use strict';

/**
 * #6750 - the `d` keyboard shortcut opens the Due date editor of the opened
 * card, but only when the user has keyboard shortcuts enabled and is not
 * typing in a field. The help list (?) names it.
 */

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

const dueDatePopup = page => page.locator('.js-pop-over').filter({
  has: page.locator('.selected-calendar-picker, .js-calendar-day'),
});

async function openAlphaCard(page, user, board, shortcutsOn) {
  // Seeded users have keyboard shortcuts switched off in their profile.
  db.updateOne('users', { _id: user.id }, { $set: { 'profile.keyboardShortcuts': shortcutsOn } });
  await loginWithToken(page, user.id, user.token);
  await openBoard(page, board.boardId, board.slug);
  const bp = new BoardPage(page);
  const cp = new CardPage(page);
  await bp.clickCard(board.listIds[0], 'Alpha Card');
  await cp.waitForOpen();
  await expect(cp.root.locator('.card-details-item-due')).toBeVisible();
  // Leave no link or button focused: shortcuts deliberately skip those.
  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  return cp;
}

test.describe('#6750 due date keyboard shortcut', () => {
  test('d opens the Due date editor of the opened card and is listed in the help', async ({ page, user, board }) => {
    const cp = await openAlphaCard(page, user, board, true);
    await page.keyboard.press('d');
    const pop = dueDatePopup(page);
    await expect(pop).toBeVisible({ timeout: 8_000 });
    await expect(pop.locator('.js-calendar-day').first()).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(pop).toBeHidden();

    // The same shortcut on a card that already has a due date opens its editor.
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    await cp.setDueDate(today);
    await expect(cp.root.locator('.card-details-item-due a.js-edit-date')).toBeVisible();
    await page.evaluate(() => document.activeElement && document.activeElement.blur());
    await page.keyboard.press('Shift+D');
    await expect(dueDatePopup(page)).toBeVisible({ timeout: 8_000 });
    await page.keyboard.press('Escape');

    await page.goto('/shortcuts');
    await expect(page.locator('.shortcuts-list-item').filter({ has: page.locator('kbd', { hasText: /^d$/ }) }))
      .toContainText('due date');
  });

  test('negative: nothing opens when keyboard shortcuts are disabled', async ({ page, user, board }) => {
    await openAlphaCard(page, user, board, false);
    await page.keyboard.press('d');
    await page.waitForTimeout(800);
    await expect(dueDatePopup(page)).toHaveCount(0);
  });

  test('negative: typing d in the card title or a comment does not open it', async ({ page, user, board }) => {
    const cp = await openAlphaCard(page, user, board, true);
    await cp.root.locator('.js-card-title .js-open-inlined-form, .card-details-title-edit-zone').first().click();
    const title = cp.root.locator('.js-card-details-title textarea, .js-card-details-title input').first();
    await title.focus();
    await page.keyboard.type('dd');
    await page.waitForTimeout(500);
    await expect(dueDatePopup(page)).toHaveCount(0);
    await expect(title).toHaveValue(/dd$/);
    await page.keyboard.press('Escape');

    const comment = cp.root.locator('form.js-new-comment-form textarea').first();
    if (await comment.count()) {
      await comment.click();
      await page.keyboard.type('d');
      await page.waitForTimeout(500);
      await expect(dueDatePopup(page)).toHaveCount(0);
    }
  });
});
