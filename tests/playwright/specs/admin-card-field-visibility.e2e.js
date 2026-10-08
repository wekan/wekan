'use strict';

// Admin Panel / Settings / Visibility / Features: the card fields every board
// shows (models/lib/cardFieldVisibility.js). The site admin unticks Pomodoro
// and saves; on a board, Pomodoro is gone from Board Settings / Card, from the
// opened card and from the minicard. Ticking it again restores what the board
// had chosen - the board's own settings are never written.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, waitForMeteor, navigateInApp, openBoard } = require('../helpers/auth');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

const setting = () => db.findOne('settings', {}, { _id: 1, cardFieldStates: 1 });
const restore = saved => (saved.cardFieldStates
  ? db.updateOne('settings', { _id: saved._id }, { $set: { cardFieldStates: saved.cardFieldStates } })
  : db.updateOne('settings', { _id: saved._id }, { $unset: { cardFieldStates: '' } }));
const openCardSettings = page => page.evaluate(() => {
  Popup.close();
  Popup.open('boardCardSettings')({ currentTarget: document.body, target: document.body, preventDefault() {}, stopPropagation() {} });
});

async function tickPomodoro(page) {
  await navigateInApp(page, '/admin/settings/visibility');
  await waitForMeteor(page);
  const row = page.locator('.js-card-field-row[data-card-field="pomodoro"]');
  await expect(row).toBeVisible();
  await row.locator('a.js-toggle-feature').click();
  await page.locator('button.js-visibility-features-save').click();
  await expect(page.locator('.js-visibility-features-status')).not.toBeEmpty();
}

test.describe('Admin card field visibility', () => {
  test('unticking Pomodoro hides it on every board, ticking restores the board\'s own choice', async ({ page, adminUser }) => {
    const saved = setting();
    const seeded = db.seedBoard({ ownerId: adminUser.id, cardTitlesPerList: [['Pomodoro Card']] });
    try {
      restore({ _id: saved._id });
      const [listId] = seeded.listIds;
      const cardId = db.findCardIdByTitle({ boardId: seeded.boardId, title: 'Pomodoro Card' });
      db.updateOne('boards', { _id: seeded.boardId }, { $set: { allowsPomodoro: true, allowsPomodoroOnMinicard: true } });
      db.updateOne('cards', { _id: cardId }, { $set: { pomodoroStartAt: new Date(), pomodoroPhase: 'work' } });

      await loginWithToken(page, adminUser.id, adminUser.token);

      // The section: every field ticked by default, and no ordering UI.
      await navigateInApp(page, '/admin/settings/visibility');
      await waitForMeteor(page);
      const rows = page.locator('.js-card-field-row');
      await expect(rows.first()).toBeVisible();
      await expect(page.locator('.js-card-field-row .js-card-field-enabled:not(.is-checked)')).toHaveCount(0);
      await expect(page.locator('.js-card-field-row .js-card-field-order-handle, .js-card-field-row [draggable="true"]')).toHaveCount(0);

      // Untick Pomodoro and save.
      await tickPomodoro(page);
      await expect.poll(() => setting().cardFieldStates?.pomodoro).toBe(false);

      const bp = new BoardPage(page);
      const cp = new CardPage(page);
      await openBoard(page, seeded.boardId, seeded.slug);
      const minicard = bp.minicard(listId, 'Pomodoro Card');
      await expect(minicard).toBeVisible();
      await expect(minicard.locator('.minicard-pomodoro')).toHaveCount(0);
      await openCardSettings(page);
      await expect(page.locator('.js-card-field-order-row[data-key="flowtime"]').first()).toBeAttached();
      await expect(page.locator('.js-card-field-order-row[data-key="pomodoro"]')).toHaveCount(0);
      await page.evaluate(() => Popup.close());
      await bp.clickCard(listId, 'Pomodoro Card');
      await cp.waitForOpen();
      await expect(cp.root.locator('.card-details-item-pomodoro')).toHaveCount(0);

      // Visibility only: the board's own choice is still stored.
      const board = db.findOne('boards', { _id: seeded.boardId }, { allowsPomodoro: 1, allowsPomodoroOnMinicard: 1 });
      expect(board.allowsPomodoro).toBe(true);
      expect(board.allowsPomodoroOnMinicard).toBe(true);
      expect(db.findOne('cards', { _id: cardId }, { pomodoroPhase: 1 }).pomodoroPhase).toBe('work');

      // Tick it again: the board shows Pomodoro as it was set.
      await tickPomodoro(page);
      await expect.poll(() => setting().cardFieldStates?.pomodoro).toBe(true);
      await openBoard(page, seeded.boardId, seeded.slug);
      await expect(bp.minicard(listId, 'Pomodoro Card').locator('.minicard-pomodoro')).toBeVisible({ timeout: 15000 });
      await openCardSettings(page);
      await expect(page.locator('.js-card-field-order-row[data-key="pomodoro"]').first()).toBeAttached();
      await page.evaluate(() => Popup.close());
      await bp.clickCard(listId, 'Pomodoro Card');
      await cp.waitForOpen();
      await expect(cp.root.locator('.card-details-item-pomodoro')).toBeVisible();
    } finally {
      restore(saved);
      db.cleanup({ boardIds: [seeded.boardId] });
    }
  });

  test('an ordinary member does not see the card field ticks', async ({ loggedInPage: page }) => {
    await navigateInApp(page, '/admin/settings/visibility');
    await waitForMeteor(page);
    await expect(page.locator('.js-card-field-row')).toHaveCount(0);
  });
});
