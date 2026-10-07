'use strict';
// #6748: Rules -> card actions -> "Set color to" was stuck on "green": picking
// another swatch in the color popup did nothing, so the saved action always set
// green. Pick red, save the rule, and check both the button and the stored
// action; a second rule that never opens the picker keeps the green default.
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { navigateInApp } = require('../helpers/auth');

async function startCardAction(page, board, title) {
  await navigateInApp(page, `/b/${board.boardId}/${board.slug}/rules`);
  await page.locator('.rules-page').waitFor({ timeout: 20_000 });
  await page.locator('#ruleTitle').fill(title);
  await page.locator('.js-goto-trigger').click();
  await page.locator('.js-add-create-trigger.js-goto-action').first().click();
  await page.locator('.js-set-card-actions').click();
}

function savedAction(board, title) {
  const rule = db.find('rules', { boardId: board.boardId, title })[0];
  return rule && db.find('actions', { _id: rule.actionId })[0];
}

test.describe('#6748 rule Set color action', () => {
  test.afterEach(({ board }) => {
    db.deleteMany('rules', { boardId: board.boardId });
    db.deleteMany('triggers', { boardId: board.boardId });
    db.deleteMany('actions', { boardId: board.boardId });
  });

  test('a color other than green can be picked and is saved', async ({ boardPage: page, board }) => {
    await startCardAction(page, board, 'Paint red');
    const colorButton = page.locator('#color-action');
    await expect(colorButton).toHaveClass(/card-details-green/);

    await colorButton.click();
    const popup = page.locator('.pop-over');
    await popup.locator('.js-palette-color.card-details-red').click();
    await expect(popup.locator('.js-palette-color.card-details-red .fa-check')).toHaveCount(1);
    await expect(popup.locator('.js-palette-color.card-details-green .fa-check')).toHaveCount(0);
    await popup.locator('.js-submit').click();

    await expect(colorButton).toHaveClass(/card-details-red/);
    await expect(colorButton).not.toHaveClass(/card-details-green/);
    await page.locator('.js-set-color-action.js-goto-rules').click();

    await expect.poll(() => savedAction(board, 'Paint red')?.selectedColor, { timeout: 15_000 }).toBe('red');
    expect(savedAction(board, 'Paint red').actionType).toBe('setColor');
  });

  test('without picking, the action keeps the green default', async ({ boardPage: page, board }) => {
    await startCardAction(page, board, 'Paint default');
    await page.locator('.js-set-color-action.js-goto-rules').click();
    await expect.poll(() => savedAction(board, 'Paint default')?.selectedColor, { timeout: 15_000 }).toBe('green');
  });
});
