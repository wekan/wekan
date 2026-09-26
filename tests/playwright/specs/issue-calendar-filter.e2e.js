'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');

test('#3361: calendar honors title filters and reopening preserves their text', async ({ boardPage: page, board }) => {
  for (const card of db.find('cards', { boardId: board.boardId })) {
    db.updateOne('cards', { _id: card._id }, { $set: { dueAt: new Date() } });
  }
  const bp = new BoardPage(page);
  await bp.switchToView('.js-open-cal-view');
  await expect(page.locator('#calendar-view .fc-event').filter({ hasText: 'Beta Card' }).first()).toBeVisible();
  await page.locator('.js-open-filter-view').click();
  const input = page.locator('.js-field-card-filter');
  await input.fill('Alpha');
  await input.press('Tab');
  await expect(page.locator('#calendar-view .fc-event').filter({ hasText: 'Beta Card' })).toHaveCount(0);
  await expect(page.locator('#calendar-view .fc-event').filter({ hasText: 'Alpha Card' }).first()).toBeVisible();
  await page.locator('.js-toggle-page-sidebar').click();
  await page.locator('.fc-listWeek-button').click();
  await expect(page.locator('#calendar-view .fc-event').filter({ hasText: 'Alpha Card' }).first()).toBeVisible();
  await expect(page.locator('#calendar-view .fc-event').filter({ hasText: 'Beta Card' })).toHaveCount(0);
  await page.locator('.js-open-filter-view').click();
  await expect(input).toHaveValue('Alpha');
  await input.fill('no-card-matches');
  await input.press('Tab');
  await expect(page.locator('#calendar-view .fc-event')).toHaveCount(0);
  await input.fill('');
  await input.press('Tab');
  await expect(page.locator('#calendar-view .fc-event').filter({ hasText: 'Beta Card' }).first()).toBeVisible();
});

test('#2044: AND/OR labels change visible cards without changing card data', async ({ boardPage: page, board }) => {
  const cards = db.find('cards', { boardId: board.boardId });
  db.updateOne('boards', { _id: board.boardId }, { $set: { labels: [{ _id: 'audit-a', name: 'Audit A', color: 'red' }, { _id: 'audit-b', name: 'Audit B', color: 'blue' }] } });
  for (const card of cards) db.updateOne('cards', { _id: card._id }, { $set: { labelIds: card.title === 'Alpha Card' ? ['audit-a', 'audit-b'] : ['audit-a'] } });
  await page.locator('.js-open-filter-view').click();
  for (const id of ['audit-a', 'audit-b']) await page.locator(`.js-toggle-label-filter[data-filter-id="${id}"]`).click();
  await expect(page.locator('.js-minicard')).toHaveCount(3);
  await page.locator('.js-label-filter-mode').selectOption('and');
  await expect(page.locator('.js-minicard')).toHaveCount(1);
  await expect(page.locator('.js-minicard')).toContainText('Alpha Card');
  await page.locator('.js-toggle-page-sidebar').click();
  await page.locator('.js-open-filter-view').click();
  await expect(page.locator('.js-label-filter-mode')).toHaveValue('and');
  await page.locator('.js-label-filter-mode').selectOption('or');
  await expect(page.locator('.js-minicard')).toHaveCount(3);
  // A second click excludes B. Exclusion wins even in AND mode.
  await page.locator('.js-toggle-label-filter[data-filter-id="audit-b"]').click();
  await page.locator('.js-label-filter-mode').selectOption('and');
  await expect(page.locator('.js-minicard')).toHaveCount(2);
  expect(db.find('cards', { boardId: board.boardId })).toHaveLength(3);
});
