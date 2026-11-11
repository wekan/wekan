'use strict';
// #6890: a card's Spent time is decimal hours; the card shows them as a
// duration, never the raw decimals a short Pomodoro left.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const CardPage = require('../pages/CardPage');

test('Spent time shows a duration, not decimal hours', async ({ boardPage: page, board }) => {
  db.updateOne('boards', { _id: board.boardId }, { $set: { allowsSpentTime: true } });
  db.updateOne('cards', { boardId: board.boardId, title: 'Alpha Card' }, { $set: { spentTime: 0.034722222222222224 } });
  await page.goto(`/b/${board.boardId}/${board.slug}`);
  await page.locator('.minicard', { hasText: 'Alpha Card' }).first().click();
  const card = new CardPage(page);
  const badge = card.root.locator('.card-time').first();
  await expect(badge).toHaveText(/2m5s/);
  await expect(badge).not.toContainText('0.0347');
});
