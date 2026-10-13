'use strict';
const { test, expect } = require('../fixtures');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');
const db = require('../helpers/db');

test('Latin card archive confirmation explains restoration without archiving before confirmation', async ({ boardPage: page, board }) => {
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'la'));
  const bp = new BoardPage(page);
  await bp.clickCard(board.listIds[0], 'Alpha Card');
  const cp = new CardPage(page);
  await cp.waitForOpen();
  await cp.openActionsMenu();
  await cp.clickAction('.js-archive');
  const pop = page.locator('.js-pop-over');
  await expect(pop).toContainText('Charta in hoc indice non apparebit postquam in archivum translata est.');
  await expect(pop).toContainText('Chartam postea ex archivo restituere potes.');
  await expect(pop).not.toContainText('Latine:');
  const card = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
  expect(card.archived).not.toBe(true);
});
