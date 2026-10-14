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

test('Malagasy bulk export explains workbook and ZIP layouts', async ({ boardPage: page }) => {
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'mg'));
  await navigateInApp(page, '/');
  const settings = page.locator('.js-export-all-boards');
  if (!(await settings.isVisible())) await page.locator('.js-toggle-page-sidebar').first().click();
  await settings.click();
  const popup = page.locator('.js-pop-over');
  await expect(popup.locator('.header-title')).toHaveText('Avoahy ny solaitra rehetra');
  await expect(popup.locator('p.quiet')).toContainText('Ny solaitra rehetra azonao avoaka');
  await expect(popup.locator('p.quiet')).toContainText('takelaka isaky ny solaitra');
  await expect(popup.locator('p.quiet')).toContainText('.zip misy rakitra isaky ny solaitra');
  await expect(popup.locator('p.quiet')).not.toContainText('Every board');
});

test('Irish bulk export explains workbook and ZIP layouts', async ({ boardPage: page }) => {
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'ga'));
  await navigateInApp(page, '/');
  const settings = page.locator('.js-export-all-boards');
  if (!(await settings.isVisible())) await page.locator('.js-toggle-page-sidebar').first().click();
  await settings.click();
  const popup = page.locator('.js-pop-over');
  await expect(popup.locator('.header-title')).toHaveText('Easpórtáil gach clár');
  await expect(popup.locator('p.quiet')).toContainText('Gach clár is féidir leat a easpórtáil');
  await expect(popup.locator('p.quiet')).toContainText('bileog do gach clár');
  await expect(popup.locator('p.quiet')).toContainText('.zip le comhad do gach clár');
  await expect(popup.locator('p.quiet')).not.toContainText('Every board');
});

test('Scottish Gaelic bulk export explains workbook and ZIP layouts', async ({ boardPage: page }) => {
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'gd'));
  await navigateInApp(page, '/');
  const settings = page.locator('.js-export-all-boards');
  if (!(await settings.isVisible())) await page.locator('.js-toggle-page-sidebar').first().click();
  await settings.click();
  const popup = page.locator('.js-pop-over');
  await expect(popup.locator('.header-title')).toHaveText('Às-phortaich a h-uile bòrd');
  await expect(popup.locator('p.quiet')).toContainText('A h-uile bòrd as urrainn dhut às-phortadh');
  await expect(popup.locator('p.quiet')).toContainText('siota airson gach bòrd');
  await expect(popup.locator('p.quiet')).toContainText('.zip le faidhle airson gach bòrd');
  await expect(popup.locator('p.quiet')).not.toContainText('Every board');
});

test('Igbo bulk export explains workbook and ZIP layouts', async ({ boardPage: page }) => {
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'ig'));
  await navigateInApp(page, '/');
  const settings = page.locator('.js-export-all-boards');
  if (!(await settings.isVisible())) await page.locator('.js-toggle-page-sidebar').first().click();
  await settings.click();
  const popup = page.locator('.js-pop-over');
  await expect(popup.locator('.header-title')).toHaveText('Bupụ bọọdụ niile');
  await expect(popup.locator('p.quiet')).toContainText('Bọọdụ ọ bụla ị nwere ike ibupụ');
  await expect(popup.locator('p.quiet')).toContainText('mpempe akwụkwọ maka bọọdụ ọ bụla');
  await expect(popup.locator('p.quiet')).toContainText('.zip nwere faịlụ maka bọọdụ ọ bụla');
  await expect(popup.locator('p.quiet')).not.toContainText('Every board');
});
