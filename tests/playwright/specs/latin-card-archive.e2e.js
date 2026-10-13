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

test('Latin WIP warning explains both recovery choices', async ({ boardPage: page }) => {
  await page.evaluate(async () => {
    await Meteor.callAsync('setLanguage', 'la');
    Popup.close();
    Popup.open('wipLimitError')({ currentTarget: document.body, target: document.body, preventDefault() {}, stopPropagation() {} });
  });
  const pop = page.locator('.js-pop-over');
  await expect(pop.locator('.header-title')).toHaveText('Limes WIP invalidus');
  await expect(pop).toContainText('maior est quam limes WIP quem constituisti.');
  await expect(pop).toContainText('quaedam munera ex hoc indice move, aut maiorem limitem WIP constitue.');
  await expect(pop).not.toContainText('Latine:');
});


test('Latin duplicate-list deletion warning limits deletion to empty matching lists', async ({ boardPage: page }) => {
  await page.evaluate(async () => {
    await Meteor.callAsync('setLanguage', 'la');
    Popup.close();
    Popup.open('deleteDuplicateLists')({ currentTarget: document.body, target: document.body, preventDefault() {}, stopPropagation() {} });
  });
  const pop = page.locator('.js-pop-over');
  await expect(pop.locator('p')).toHaveText('Certusne es? Omnes indices duplicati qui idem nomen habent et nullas chartas continent delebuntur.');
  await expect(pop).not.toContainText('Latine:');
  await expect(pop.locator('button.js-confirm')).toBeVisible();
});


test('Latin swimlane deletion warns that recovery is impossible', async ({ boardPage: page }) => {
  await page.evaluate(async () => {
    await Meteor.callAsync('setLanguage', 'la');
    Popup.close();
    Popup.open('swimlaneDelete')({ currentTarget: document.body, target: document.body, preventDefault() {}, stopPropagation() {} });
  });
  const pop = page.locator('.js-pop-over');
  await expect(pop.locator('.header-title')).toHaveText('Delere semitam?');
  await expect(pop.locator('p')).toContainText('neque semitam recuperare poteris. Deletio revocari non potest.');
  await expect(pop).not.toContainText('Latine:');
  await expect(pop.locator('button.js-confirm')).toBeVisible();
});


test('Latin card window controls distinguish maximizing from minimizing', async ({ boardPage: page, board }) => {
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'la'));
  await new BoardPage(page).clickCard(board.listIds[0], 'Alpha Card');
  const card = new CardPage(page);
  await card.waitForOpen();
  const maximize = card.root.locator('.js-maximize-card-details');
  const minimize = card.root.locator('.js-minimize-card-details');
  if (!(await maximize.isVisible())) await minimize.click();
  await expect(maximize).toHaveAttribute('title', 'Maximam fac fenestram chartae');
  await maximize.click();
  await expect(minimize).toHaveAttribute('title', 'Minimam fac fenestram chartae');
  await minimize.click();
  await expect(maximize).toBeVisible();
});
