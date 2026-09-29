'use strict';
// #2419: a GFM task-list item renders a visible, disabled checkbox in the card
// viewer, and no other form field written into card text is rendered.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { openBoard } = require('../helpers/auth');

test('card text cannot render form fields; task checkboxes show, disabled', async ({ boardPage: page, board }) => {
  const card = db.findOne('cards', { boardId: board.boardId });
  db.updateOne('cards', { _id: card._id }, { $set: { description:
    'Before\n\n<input type="password" placeholder="Your password">\n<input type="text">\n\n- [ ] open task\n- [x] done task' } });
  await openBoard(page, board.boardId, board.slug);
  await page.locator('.minicard', { hasText: card.title }).first().locator('.minicard-title').click();
  const viewer = page.locator('.card-details .viewer', { hasText: 'Before' }).first();
  await expect(viewer).toContainText('open task');
  // Negative: the password and text fields are gone.
  await expect(viewer.locator('input:not([type="checkbox"])')).toHaveCount(0);
  // Positive: both task boxes are there, disabled, visible and in the right state.
  const boxes = viewer.locator('input[type="checkbox"][disabled]');
  await expect(boxes).toHaveCount(2);
  await expect(boxes.nth(0)).toBeVisible();
  await expect(boxes.nth(0)).not.toBeChecked();
  await expect(boxes.nth(1)).toBeChecked();
  const size = await boxes.nth(0).boundingBox();
  expect(size.width).toBeGreaterThan(0);
});
