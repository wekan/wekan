'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

for (const type of ['received', 'start', 'due', 'end']) {
  test(`saving and deleting ${type} date preserves the open card position`, async ({ boardPage: page, board }) => {
    await new BoardPage(page).clickCard(board.listIds[0], 'Alpha Card');
    const cp = new CardPage(page);
    await cp.waitForOpen();
    const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
    await cp.root.locator(`.js-${type}-date`).click();
    const popup = page.locator('.js-pop-over');
    await popup.locator('.js-calendar-day:not([disabled])').first().click();
    async function observeSave(action, deleted) {
      await cp.root.evaluate(el => {
        window.datePosition = { el, left: el.getBoundingClientRect().left, samples: [] };
        const sample = () => {
          const state = window.datePosition;
          if (!state) return;
          state.samples.push({ connected: el.isConnected, left: el.getBoundingClientRect().left });
          state.frame = requestAnimationFrame(sample);
        };
        sample();
      });
      await action();
      await expect(popup).toHaveCount(0);
      await expect.poll(() => !!db.findOne('cards', { _id: card._id })[`${type}At`]).toBe(!deleted);
      if (deleted) await expect(cp.root.locator(`.js-${type}-date`)).toBeVisible();
      else await expect(cp.root.locator(`.${type}-date`).first()).toBeVisible();
      // Observe through the refreshed subscription and two complete paint frames.
      await page.waitForFunction(() => Object.values(Meteor.connection._subscriptions).every(sub => sub.ready));
      const result = await page.evaluate(async () => {
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        const state = window.datePosition;
        cancelAnimationFrame(state.frame);
        delete window.datePosition;
        return { same: state.el === document.querySelector('.board-wrapper > .js-card-details'), left: state.left, samples: state.samples };
      });
      expect(result.same).toBe(true);
      expect(result.samples.every(sample => sample.connected && Math.abs(sample.left - result.left) < 1)).toBe(true);
    }
    await observeSave(() => popup.locator('.edit-date button[type="submit"]').click(), false);
    await cp.root.locator(`.${type}-date .js-edit-date, a.${type}-date.js-edit-date`).first().click();
    await observeSave(() => popup.locator('.js-delete-date').click(), true);
  });
}
