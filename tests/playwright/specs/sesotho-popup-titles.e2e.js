'use strict';
const { test, expect } = require('../fixtures');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

test('Southern Sotho titles distinguish card labels and account anonymization', async ({ boardPage: page, board }) => {
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'st'));
  await new BoardPage(page).clickCard(board.listIds[0], 'Alpha Card');
  const card = new CardPage(page);
  await card.waitForOpen();
  await card.openLabelSelector();
  const title = page.locator('.js-pop-over .header-title');
  await expect(title).toHaveText('Dileibole');
  await expect(title).not.toHaveText('Ditlhaku');
  // Render the confirmation only; never confirm the account mutation.
  await page.evaluate(() => {
    Popup.close();
    Popup.open('userAnonymize')({ currentTarget: document.body, target: document.body, preventDefault() {} });
  });
  await expect(title).toHaveText('Pata boitsebiso ba akhaonto');
  await expect(title).not.toContainText('kenngwang');
  await page.evaluate(() => Popup.close());
});
