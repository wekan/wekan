'use strict';

const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken, openBoard } = require('../helpers/auth');
const BoardPage = require('../pages/BoardPage');

test('swimlane controls retain neutral and hover colors independently of the title', async ({ page, user, board }, testInfo) => {
  db.updateOne('swimlanes', { _id: board.swimlaneId }, { $set: { color: 'blue' } });
  await loginWithToken(page, user.id, user.token);
  await openBoard(page, board.boardId, board.slug);
  const header = page.locator('.swimlane-header-wrap').first();
  for (const selector of ['.swimlane-collapse-indicator', '.js-open-swimlane-menu', '.swimlane-header-plus-icon']) {
    const control = header.locator(selector);
    await page.mouse.move(0, 0);
    await expect(control).toHaveCSS('color', 'rgb(166, 166, 166)');
    await control.hover();
    await expect(control).toHaveCSS('color', 'rgb(51, 51, 51)');
  }
  await page.mouse.move(0, 0);
  await page.screenshot({ path: testInfo.outputPath('swimlane-controls.png') });
});

test('card window controls no longer inherit the colored card title', async ({ page, user, board }, testInfo) => {
  db.updateOne('cards', { boardId: board.boardId, title: 'Alpha Card' }, { $set: { color: 'blue' } });
  await loginWithToken(page, user.id, user.token);
  await openBoard(page, board.boardId, board.slug);
  const boardPage = new BoardPage(page);
  await boardPage.clickCard(board.listIds[0], 'Alpha Card');
  const details = page.locator('.card-details').first();
  await expect(details.locator('.card-collapse-toggle')).toHaveCSS('color', 'rgb(0, 0, 0)');
  await expect(details.locator('.card-header-control')).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('card-controls.png') });
});
