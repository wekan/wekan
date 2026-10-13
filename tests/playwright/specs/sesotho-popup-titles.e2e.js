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


test('Southern Sotho archive help points to All Boards', async ({ boardPage: page }) => {
  await page.evaluate(() => {
    return Meteor.callAsync('setLanguage', 'st');
  });
  await page.evaluate(() => {
    Popup.open('archiveBoard')({ currentTarget: document.body, target: document.body, preventDefault() {} });
  });
  const popup = page.locator('.js-pop-over');
  await expect(popup).toContainText('Polokelo');
  await expect(popup).toContainText('leqepheng la Diboto tsohle');
  await expect(popup).not.toContainText('hloohong ya leqephe la lapeng');
  // Inspect the help without confirming the archive operation.
  await page.evaluate(() => Popup.close());
});
