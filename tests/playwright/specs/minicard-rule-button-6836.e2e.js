'use strict';
// #6836 "show rule button on minicard": already there - Board Settings / Card,
// Card buttons, Show on Minicard (allowsCardButtonsOnMinicard, since v12.16).
// A card-button rule's button is drawn under each minicard, and a click runs
// the rule on that card without opening it. Off by default.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');

function seedButtonRule(boardId, label) {
  const id = `minicard-button-${Date.now()}`;
  db.insertOne('triggers', { _id: id, boardId, activityType: 'button', buttonType: 'card', buttonLabel: label });
  db.insertOne('actions', { _id: id, boardId, actionType: 'archive' });
  db.insertOne('rules', { _id: id, boardId, title: label, triggerId: id, actionId: id, buttonType: 'card', buttonLabel: label });
  return id;
}

test('a card-button rule is a button on the minicard, and runs without opening the card', async ({ page, user, board }) => {
  const label = 'Archive it';
  const id = seedButtonRule(board.boardId, label);
  db.updateOne('boards', { _id: board.boardId }, { $set: { allowsCardButtonsOnMinicard: true } });
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  try {
    await loginWithToken(page, user.id, user.token);
    await openBoard(page, board.boardId, board.slug);
    const minicard = page.locator('.js-minicard', { hasText: 'Alpha Card' }).first();
    const button = minicard.locator('.js-run-minicard-card-button', { hasText: label });
    await expect(button).toBeVisible({ timeout: 15_000 });
    const url = page.url();
    await button.click();
    await expect.poll(() => db.findOne('cards', { _id: card._id }).archived, { timeout: 15_000 }).toBe(true);
    expect(page.url(), 'the card was not opened').toBe(url);
    await expect(page.locator('section.js-card-details')).toHaveCount(0);
  } finally {
    for (const collection of ['rules', 'triggers', 'actions']) db.deleteOne(collection, { _id: id });
  }
});

test('negative: with Show on Minicard off (the default) the minicard has no rule button', async ({ page, user, board }) => {
  const id = seedButtonRule(board.boardId, 'Not here');
  db.updateOne('boards', { _id: board.boardId }, { $unset: { allowsCardButtonsOnMinicard: '' } });
  try {
    await loginWithToken(page, user.id, user.token);
    await openBoard(page, board.boardId, board.slug);
    await expect(page.locator('.js-minicard', { hasText: 'Alpha Card' })).toBeVisible();
    await page.waitForTimeout(1500);
    await expect(page.locator('.js-run-minicard-card-button')).toHaveCount(0);
  } finally {
    for (const collection of ['rules', 'triggers', 'actions']) db.deleteOne(collection, { _id: id });
  }
});
