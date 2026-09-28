'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { openBoard } = require('../helpers/auth');
const DAY = 86400000;

test('creation and modification presets filter immediately, combine, persist and clear', async ({ loggedInPage: page, board }) => {
  const cards = db.find('cards', { boardId: board.boardId });
  const [recent, weekly, old] = cards;
  const now = Date.now();
  for (const [card, created, modified] of [[recent, 0.1, 0.1], [weekly, 3, 0.1], [old, 40, 40]]) {
    db.updateOne('cards', { _id: card._id }, { $set: {
      createdAt: new Date(now - created * DAY), modifiedAt: new Date(now - modified * DAY),
    } });
  }
  await openBoard(page, board.boardId, board.slug);
  await page.locator('.js-open-filter-view').click();
  const created = page.locator('.js-card-date-recency[data-field="createdAt"]');
  const modified = page.locator('.js-card-date-recency[data-field="modifiedAt"]');
  const expectCards = ids => expect.poll(() => page.locator('.board-canvas .js-minicard')
    .evaluateAll(rows => rows.map(row => row.dataset.cardId).sort())).toEqual([...ids].sort());
  for (const [preset, ids] of [['day', [recent._id]], ['week', [recent._id, weekly._id]],
    ['month', [recent._id, weekly._id]], ['older', [old._id]]]) {
    await created.and(page.locator(`[value="${preset}"]`)).check(); await expectCards(ids);
  }
  await created.and(page.locator('[value="week"]')).check();
  await modified.and(page.locator('[value="older"]')).check();
  await expectCards([]);
  await modified.and(page.locator('[value="day"]')).check();
  await expectCards([recent._id, weekly._id]);
  await page.locator('.js-open-filter-view').click();
  await page.locator('.js-open-filter-view').click();
  await expect(created.and(page.locator(':checked'))).toHaveValue('week');
  await expect(modified.and(page.locator(':checked'))).toHaveValue('day');
  await created.and(page.locator('[value=""]')).check();
  // Future, missing and malformed dates must not match the recent range.
  for (const bad of [null, '2026-09-28', new Date(now + 2 * DAY)]) {
    db.updateOne('cards', { _id: recent._id }, { $set: { modifiedAt: bad } });
    await expectCards([weekly._id]);
  }
  await page.locator('.js-clear-all').click();
  await expectCards(cards.map(card => card._id));
  await page.locator('.js-open-filter-view').click();
  await expect(created.and(page.locator(':checked'))).toHaveValue('');
  await expect(modified.and(page.locator(':checked'))).toHaveValue('');
  for (const card of cards) expect(db.findOne('cards', { _id: card._id }).archived).toBe(false);
});
