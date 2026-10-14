'use strict';
const { test, expect } = require('../fixtures');
const strings = require('../../../imports/i18n/data/ga.i18n.json');
const db = require('../helpers/db');

for (const [name, selector, key, forbidden] of [
  ['cardRecurrenceInterval', '.header-title', 'cardRecurrenceIntervalPopup-title', 'Athshocrú'],
  ['moveCard', 'label[for="move-card-reason"]', 'move-reason', 'Cur síos'],
  ['userAnonymize', 'p', 'anonymize-account-confirm-popup', 'sealadacha'],
]) {
  test(`Irish ${name} preserves the action meaning`, async ({ boardPage: page, board }) => {
    const source = db.findOne('cards', { boardId: board.boardId, title: 'Alpha Card' });
    await page.evaluate(async ({ name, source }) => {
      await Meteor.callAsync('setLanguage', 'ga');
      Popup.close();
      Popup.open(name, name === 'moveCard' ? { dataContext: source } : {})({
        currentTarget: document.body, target: document.body, preventDefault() {},
      });
    }, { name, source });
    const target = page.locator('.js-pop-over').locator(selector);
    await expect(target).toContainText(strings[key]);
    await expect(target).not.toContainText(forbidden);
    if (name === 'cardRecurrenceInterval') {
      await expect(page.locator('.js-pop-over [data-interval="none"]')).toContainText(strings['card-recurrence-interval-none']);
    }
    await page.evaluate(() => Popup.close());
    await expect(page.locator('.js-toggle-header-icons-collapsed')).toHaveAttribute('title', strings['toggle-header-icons-collapsed']);
  });
}
