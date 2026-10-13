'use strict';
const { test, expect } = require('../fixtures');
const BoardPage = require('../pages/BoardPage');
const strings = require('../../../imports/i18n/data/co.i18n.json');

test('Corsican archive tabs distinguish empty cards, lists and swimlanes', async ({ boardPage: page }) => {
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'co'));
  await new BoardPage(page).openSidebar();
  await page.locator('.board-sidebar .js-open-board-menu').click();
  await page.locator('.js-pop-over .js-open-archives').click();
  for (const tab of ['cards', 'lists', 'swimlanes']) {
    await page.locator(`#archive-tab-${tab}`).click();
    const empty = page.locator(`#archive-panel-${tab} .no-items-message`);
    await expect(empty).toHaveText(strings[`no-archived-${tab}`]);
    await expect(empty).not.toContainText('Non ci sono');
  }
});
