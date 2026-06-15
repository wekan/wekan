'use strict';
const { test } = require('../fixtures');
const db = require('../helpers/db');

async function openRulesPage(page, board) {
  await page.goto(`/b/${board.boardId}/${board.slug}/rules`, { waitUntil: 'commit' });
  await page.locator('.rules-page').waitFor({ timeout: 20_000 });
}

test.describe('CHECK', () => {
  test('check board button minimongo', async ({ boardPage, board }) => {
    await openRulesPage(boardPage, board);
    await boardPage.locator('#ruleTitle').fill('My board button');
    await boardPage.locator('.js-goto-trigger').click();
    await boardPage.locator('.js-set-button-triggers').click();
    await boardPage.locator('#button-label').fill('Do the thing');
    await boardPage.locator('#button-type').selectOption('board');
    await boardPage.locator('.js-add-button-trigger.js-goto-action').click();
    await boardPage.locator('.js-add-gen-move-action.js-goto-rules').first().click();
    await boardPage.locator('.rules-lists-item').first().waitFor({ timeout: 15000 });
    console.log('DB triggers:', db.mongoEval(`db.triggers.find({boardId:${db.literal(board.boardId)}}).count()`));
    await boardPage.goto(`/b/${board.boardId}/${board.slug}`, { waitUntil: 'commit' });
    for (let i = 0; i < 6; i++) {
      await boardPage.waitForTimeout(1000);
      const n = await boardPage.locator('.js-run-board-button').count();
      console.log(`t+${i}s buttons=${n}`);
    }
  });
});
