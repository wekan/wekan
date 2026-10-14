'use strict';
const { test, expect } = require('../fixtures');
const { navigateInApp } = require('../helpers/auth');

test('Haitian Creole bulk export explains workbook and ZIP layouts', async ({ boardPage: page }) => {
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'ht'));
  await navigateInApp(page, '/');
  const settings = page.locator('.js-export-all-boards');
  if (!(await settings.isVisible())) await page.locator('.js-toggle-page-sidebar').first().click();
  await settings.click();
  const popup = page.locator('.js-pop-over');
  await expect(popup.locator('.header-title')).toHaveText('Ekspòte tout tablo yo');
  await expect(popup.locator('p.quiet')).toContainText('Tout tablo ou gen dwa ekspòte');
  await expect(popup.locator('p.quiet')).toContainText('yon sèl liv travay ak yon fèy pou chak tablo');
  await expect(popup.locator('p.quiet')).toContainText('yon .zip ak yon fichye pou chak tablo');
  await expect(popup.locator('p.quiet')).not.toContainText('Every board');
});
