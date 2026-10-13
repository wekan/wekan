'use strict';
const { test, expect } = require('../fixtures');
const BoardPage = require('../pages/BoardPage');
const CardPage = require('../pages/CardPage');

test('Latin dependency picker distinguishes both relation directions', async ({ boardPage: page, board }) => {
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'la'));
  await new BoardPage(page).clickCard(board.listIds[0], 'Alpha Card');
  const card = new CardPage(page);
  await card.waitForOpen();
  const add = card.root.locator('.js-add-dependency');
  if (!(await add.isVisible())) await card.root.locator('.js-toggle-card-section[data-section="dependencies"]').click();
  await add.click();
  const select = page.locator('.js-pop-over .js-new-dependency-type');
  for (const [value, label] of [['blocks', 'Impedit'], ['is-blocked-by', 'Impeditur a'], ['fixes', 'Corrigit'], ['is-fixed-by', 'Corrigitur a']]) {
    await expect(select.locator(`option[value="${value}"]`)).toHaveText(label);
  }
  await select.selectOption('is-blocked-by');
  await expect(select).toHaveValue('is-blocked-by');
});
