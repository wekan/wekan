'use strict';
const { test, expect } = require('../fixtures');

test('Latin organization admin popup explains the limits of delegated administration', async ({ boardPage: page }) => {
  await page.evaluate(async () => {
    await Meteor.callAsync('setLanguage', 'la');
    Popup.close();
    Popup.open('orgAdmins')({ currentTarget: document.body, target: document.body, preventDefault() {}, stopPropagation() {} });
  });
  const pop = page.locator('.js-pop-over');
  await expect(pop).toContainText('eius homines et exemplaria subsidiaria, nihil aliud.');
  await expect(pop).toContainText('Numquam possunt ius administratoris totius situs concedere, neque administratorem situs administrare.');
  await expect(pop).not.toContainText('Latine:');
  await expect(pop.locator('.js-toggle-org-admin')).toHaveCount(0);
});
