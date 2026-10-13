'use strict';
const { test, expect } = require('../fixtures');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

test('Latin checklist menu distinguishes moving from copying', async ({ boardPage: page, board }) => {
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'la'));
  await new BoardPage(page).clickCard(board.listIds[0], 'Alpha Card');
  const card = new CardPage(page);
  await card.waitForOpen();
  await card.addChecklist('Probatio');
  const checklist = card.root.locator('.js-checklist').filter({ hasText: 'Probatio' }).first();
  const menu = checklist.locator('.js-open-checklist-details-menu');
  await expect(menu).toHaveAttribute('title', 'Actiones indicis probationis');
  await menu.click();
  const pop = page.locator('.js-pop-over');
  await expect(pop.locator('.js-move-checklist')).toContainText('Transfer indicem probationis');
  await expect(pop.locator('.js-copy-checklist')).toContainText('Exscribe indicem probationis');
  await expect(pop.locator('.js-move-checklist')).not.toContainText('Exscribe');
});
