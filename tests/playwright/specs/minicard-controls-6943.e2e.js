'use strict';

// #6943: the collapse caret and the card actions menu (☰) at the top of every
// minicard can each be hidden in Board Settings / Card (Card, Show on
// Minicard) and in the Admin Panel's card fields, and the minicard's content
// then takes their place. Negative: a board that never chose shows both.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const BoardPage = require('../pages/BoardPage');

async function toggleMinicardRow(page, key) {
  if (!await page.locator('.board-sidebar.is-open').isVisible()) await page.locator('.js-toggle-page-sidebar').click();
  await page.locator('.board-sidebar .js-open-board-menu').click();
  await page.locator('.js-pop-over .js-open-board-card-settings').click();
  const popup = page.locator('.js-pop-over');
  const toggle = popup.locator(`.js-card-settings-pane[data-side="minicard"] .js-card-settings-section[data-section="card"] .js-card-field-order-row[data-key="${key}"][data-side="minicard"] a.card-field-order-toggle`);
  await toggle.scrollIntoViewIfNeeded();
  await toggle.click();
  await popup.locator('.js-close-pop-over').click();
}

test('Board Settings / Card hides the minicard caret and menu, and the content widens', async ({ boardPage: page, board }) => {
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  const labelId = db.uid('label');
  db.updateOne('boards', { _id: board.boardId }, { $set: { labels: [{ _id: labelId, name: 'Wide label', color: 'green' }], allowsLabelsOnMinicard: true } });
  db.updateOne('cards', { _id: card._id }, { $set: { labelIds: [labelId] } });
  const mini = new BoardPage(page).minicard(board.listIds[0], 'Alpha Card');

  // Negative: never chosen, both are there.
  await expect(mini.locator('.js-collapse-minicard')).toHaveCount(1);
  await expect(mini.locator('.js-open-minicard-details-menu')).toHaveCount(1);
  const labelsWidth = () => mini.locator('.minicard-labels').evaluate(el => el.getBoundingClientRect().width);
  await expect(mini.locator('.minicard-labels')).toBeVisible();
  const before = await labelsWidth();
  const cardHeight = () => mini.locator('.minicard').evaluate(el => el.getBoundingClientRect().height);
  const heightWithControls = await cardHeight();
  // WCAG 2.5.8: each is still a 24 x 24 target.
  for (const control of ['.js-collapse-minicard', '.js-open-minicard-details-menu']) {
    const box = await mini.locator(control).boundingBox();
    expect(box.width).toBeGreaterThanOrEqual(24);
    expect(box.height).toBeGreaterThanOrEqual(24);
  }

  await toggleMinicardRow(page, 'minicardMenu');
  await expect.poll(() => db.findOne('boards', { _id: board.boardId }).allowsMinicardMenu).toBe(false);
  await expect(mini.locator('.js-open-minicard-details-menu')).toHaveCount(0);
  await expect(mini.locator('.minicard')).toHaveClass(/minicard-no-menu/);
  await expect.poll(labelsWidth).toBeGreaterThan(before + 40);

  await toggleMinicardRow(page, 'collapse');
  await expect.poll(() => db.findOne('boards', { _id: board.boardId }).allowsMinicardCollapse).toBe(false);
  await expect(mini.locator('.js-collapse-minicard')).toHaveCount(0);
  // The controls never made the card taller: v13.31's 24px targets did, on
  // every card's first line.
  expect(Math.abs(await cardHeight() - heightWithControls)).toBeLessThanOrEqual(1);

  // It stays so after a reload, and the title starts at the card's edge.
  await page.reload();
  await expect(mini.locator('.minicard-title')).toBeVisible();
  await expect(mini.locator('.js-collapse-minicard')).toHaveCount(0);
  await expect(mini.locator('.js-open-minicard-details-menu')).toHaveCount(0);

  // Ticked again, the menu is back.
  await toggleMinicardRow(page, 'minicardMenu');
  await expect(mini.locator('.js-open-minicard-details-menu')).toHaveCount(1);
});

test('the Admin Panel hides both on every board', async ({ boardPage: page, board }) => {
  const mini = new BoardPage(page).minicard(board.listIds[0], 'Alpha Card');
  await expect(mini.locator('.js-open-minicard-details-menu')).toHaveCount(1);
  db.updateOne('settings', {}, { $set: { 'cardFieldStates.minicardMenu': false, 'cardFieldStates.collapse': false } });
  try {
    await expect(mini.locator('.js-open-minicard-details-menu')).toHaveCount(0);
    await expect(mini.locator('.js-collapse-minicard')).toHaveCount(0);
    // Visibility only: the board's own choice is not changed.
    const stored = db.findOne('boards', { _id: board.boardId });
    expect(stored.allowsMinicardMenu).not.toBe(false);
  } finally {
    db.updateOne('settings', {}, { $unset: { 'cardFieldStates.minicardMenu': 1, 'cardFieldStates.collapse': 1 } });
  }
  await expect(mini.locator('.js-open-minicard-details-menu')).toHaveCount(1);
});
