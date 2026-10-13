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

test('Latin comment editor keeps the intentionally empty placeholder', async ({ boardPage: page, board }) => {
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'la'));
  await new BoardPage(page).clickCard(board.listIds[0], 'Alpha Card');
  const cp = new CardPage(page);
  await cp.waitForOpen();
  const editor = cp.root.locator('form.js-new-comment-form textarea.editor');
  await expect(editor).toHaveAttribute('placeholder', '');
  await expect(editor).toHaveValue('');
});

test('Latin card export popup has the translated action title', async ({ boardPage: page, board }) => {
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'la'));
  await new BoardPage(page).clickCard(board.listIds[0], 'Alpha Card');
  const cp = new CardPage(page);
  await cp.waitForOpen();
  await cp.openActionsMenu();
  await cp.clickAction('.js-export-card');
  const title = page.locator('.js-pop-over .header-title');
  await expect(title).toHaveText('Exporta chartam');
  await expect(title).not.toContainText('Latine:');
});

test('Latin list deletion warning distinguishes permanent loss from archiving', async ({ boardPage: page }) => {
  await page.evaluate(async () => {
    await Meteor.callAsync('setLanguage', 'la');
    Popup.close();
    Popup.open('listDelete')({ currentTarget: document.body, target: document.body, preventDefault() {}, stopPropagation() {} });
  });
  const pop = page.locator('.js-pop-over');
  await expect(pop).toContainText('indicem recuperare non poteris. Revocari non potest.');
  await expect(pop).toContainText('Indicem in archivum transferre potes');
  await expect(pop).toContainText('actiones serves.');
  await expect(pop).not.toContainText('Latine:');
});
