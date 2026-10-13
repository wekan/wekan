'use strict';
const { test, expect } = require('../fixtures');
const BoardPage = require('../pages/BoardPage');
for (const language of ['co', 'la']) {
const strings = require(`../../../imports/i18n/data/${language}.i18n.json`);

test(`Archive tabs distinguish empty cards, lists and swimlanes in ${language}`, async ({ boardPage: page }) => {
  await page.evaluate(language => Meteor.callAsync('setLanguage', language), language);
  await new BoardPage(page).openSidebar();
  await page.locator('.board-sidebar .js-open-board-menu').click();
  await page.locator('.js-pop-over .js-open-archives').click();
  for (const tab of ['cards', 'lists', 'swimlanes']) {
    await page.locator(`#archive-tab-${tab}`).click();
    const empty = page.locator(`#archive-panel-${tab} .no-items-message`);
    await expect(empty).toHaveText(strings[`no-archived-${tab}`]);
    await expect(empty).not.toContainText(language === 'la' ? 'Latine:' : 'Non ci sono');
  }
});

}
