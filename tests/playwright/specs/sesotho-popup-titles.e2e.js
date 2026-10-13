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


test('Southern Sotho card linking names the destination without claiming the current board', async ({ boardPage: page, board }) => {
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'st'));
  await new BoardPage(page).clickCard(board.listIds[0], 'Alpha Card');
  const card = new CardPage(page);
  await card.waitForOpen();
  await card.openActionsMenu();
  const action = page.locator('.js-pop-over .js-link-card-to-board');
  await expect(action).toHaveText('Hokela botong');
  await expect(action).not.toContainText('ena');
  await page.evaluate(() => Popup.close());
});


test('Southern Sotho card settings identify data fields', async ({ boardPage: page }) => {
  await page.evaluate(async () => {
    await Meteor.callAsync('setLanguage', 'st');
    Popup.open('boardCardSettings')({ currentTarget: document.body, target: document.body, preventDefault() {}, stopPropagation() {} });
  });
  const heading = page.locator('.js-pop-over .card-field-order-heading');
  await expect(heading).toHaveText('Tatellano ya dikarolo tsa karete');
  await expect(heading).not.toContainText('masimo');
  await page.evaluate(() => Popup.close());
});


test('Southern Sotho workflow format automatically detects rather than learns', async ({ boardPage: page }) => {
  await page.evaluate(async () => {
    await Meteor.callAsync('setLanguage', 'st');
    Popup.open('rulesImportExport')({ currentTarget: document.body, target: document.body, preventDefault() {}, stopPropagation() {} });
  });
  const option = page.locator('.js-pop-over .js-workflow-format option[value="auto"]');
  await expect(option).toHaveText('Lemoha ka boiketsetso');
  await expect(option).not.toContainText('Ithute');
  await expect(page.locator('.js-pop-over .js-rules-import-text')).toBeEmpty();
  await page.evaluate(() => Popup.close());
});


test('Southern Sotho due-card view translates the short personal filter', async ({ boardPage: page }) => {
  await page.evaluate(async () => {
    await Meteor.callAsync('setLanguage', 'st');
    Popup.open('dueCardsViewChange')({ currentTarget: document.body, target: document.body, preventDefault() {}, stopPropagation() {} });
  });
  const option = page.locator('.js-pop-over .js-due-cards-view-me');
  await expect(option).toHaveText('Nna');
  await expect(option).not.toHaveText('Me');
  await page.evaluate(() => Popup.close());
});
