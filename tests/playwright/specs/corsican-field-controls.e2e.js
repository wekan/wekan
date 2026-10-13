'use strict';
const { test, expect } = require('../fixtures');

test('Corsican custom field controls display translated types', async ({ boardPage: page }) => {
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'co'));
  await page.locator('.js-minicard .minicard-title').first().click();
  await page.locator('.js-open-custom-fields-settings').click();
  await page.locator('.js-open-create-custom-field').click();
  const popup = page.locator('.js-pop-over');
  await expect(popup.locator('.header-title')).toHaveText('Creà un campu');
  const strings = require('../../../imports/i18n/data/co.i18n.json');
  for (const key of ['show-field-on-card', 'automatically-field-on-card', 'always-field-on-card', 'showLabel-field-on-card']) {
    await expect(popup.getByText(strings[key], { exact: true })).toBeVisible();
  }
  await expect(popup).not.toContainText('alle nuove carte');
  const types = popup.locator('.js-field-type');
  for (const [value, label] of [
    ['text', 'Testu'], ['number', 'Numeru'],
    ['dropdown', 'Lista di scelta'],
    ['dropdownMultiSelect', 'Lista di scelta (selezzione multipla)'],
  ]) {
    await expect(types.locator(`option[value="${value}"]`)).toHaveText(label);
  }
  await expect(types).not.toContainText('Testo');
  await expect(types).not.toContainText('multiplla');
});
