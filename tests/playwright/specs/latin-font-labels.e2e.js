'use strict';
const { test, expect } = require('../fixtures');

test('Latin font popup labels the default as no custom font', async ({ boardPage: page }) => {
  await page.evaluate(async () => {
    await Meteor.callAsync('setLanguage', 'la');
    Popup.close();
    Popup.open('changeFont')({ currentTarget: document.body, target: document.body, preventDefault() {}, stopPropagation() {} });
  });
  const form = page.locator('.js-pop-over form.change-font');
  await expect(form).toBeVisible();
  await expect(form.locator('label').first()).toHaveText('Forma litterarum');
  const defaultFont = form.locator('.js-ui-font-btn[data-font=""]');
  await expect(defaultFont).toHaveText('Praedefinitum (sine forma litterarum propria)');
  await expect(defaultFont).not.toContainText('Latine:');
});
