'use strict';

/**
 * #6852 - the Rules page had no way back to the board: its own Back went with
 * its old sidebar, and only the trigger, action and rule details pages kept a
 * Back, to the rules list. The rules list and its views now have a Back to
 * the board; the three sub-pages keep their own and show no second one.
 */

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, navigateInApp } = require('../helpers/auth');

test.describe('#6852 Rules page Back to the board', () => {
  test.use({ storageState: undefined });

  test('Back on the Rules page opens the board', async ({ page, adminUser }) => {
    const board = await db.seedBoard({ ownerId: adminUser.id, title: 'Rules Back Board' });
    await loginWithToken(page, adminUser.id, adminUser.token);
    await navigateInApp(page, `/b/${board.boardId}/${board.slug}/rules`);
    const back = page.locator('a.js-rules-back-to-board');
    await expect(back).toBeVisible({ timeout: 15_000 });
    await expect(back).toHaveAttribute('href', new RegExp(`/b/${board.boardId}/${board.slug}$`));
    await back.click();
    await expect(page).toHaveURL(new RegExp(`/b/${board.boardId}/${board.slug}$`));
    await expect(page.locator('.rules-page')).toHaveCount(0);
    await expect(page.locator('.js-list').first()).toBeVisible({ timeout: 15_000 });
  });

  test('negative: Add rule shows only its own Back, to the rules list', async ({ page, adminUser }) => {
    const board = await db.seedBoard({ ownerId: adminUser.id, title: 'Rules Back Sub Board' });
    await loginWithToken(page, adminUser.id, adminUser.token);
    await navigateInApp(page, `/b/${board.boardId}/${board.slug}/rules`);
    await expect(page.locator('a.js-rules-back-to-board')).toBeVisible({ timeout: 15_000 });
    await page.locator('button.js-goto-trigger').click();
    await expect(page.locator('button.js-goback')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('a.js-rules-back-to-board')).toHaveCount(0);
    // Its Back returns to the list, where the Back to the board is again.
    await page.locator('button.js-goback').click();
    await expect(page.locator('a.js-rules-back-to-board')).toBeVisible();
    expect(page.url()).toContain('/rules');
  });
});
