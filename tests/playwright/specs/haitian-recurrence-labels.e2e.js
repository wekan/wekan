'use strict';
const { test, expect } = require('../fixtures');

test('Haitian recurrence and checklist reset popups describe different actions', async ({ boardPage: page }) => {
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'ht'));
  async function open(name) {
    await page.evaluate(name => {
      Popup.close();
      Popup.open(name)({ currentTarget: document.body, target: document.body, preventDefault() {} });
    }, name);
  }
  await open('cardRecurrenceInterval');
  const popup = page.locator('.js-pop-over');
  await expect(popup.locator('.header-title')).toHaveText('Repetisyon kat la');
  await expect(popup.locator('[data-interval="none"]')).toContainText('pa repete kat la otomatikman');
  await expect(popup).not.toContainText('Reyajisteman');
  await open('checklistResetInterval');
  await expect(popup.locator('.header-title')).toHaveText('Retire mak yo otomatikman');
  await expect(popup.locator('[data-interval="none"]')).toContainText('pa retire mak yo otomatikman');
  await expect(popup).not.toContainText('Repetisyon kat');
  await page.evaluate(() => Popup.close());
});
