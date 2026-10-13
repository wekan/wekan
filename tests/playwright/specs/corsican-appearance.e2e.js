'use strict';
const { test, expect } = require('../fixtures');

test('Corsican member font controls use translated size labels', async ({ boardPage: page }) => {
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'co'));
  await page.locator('.js-open-header-member-menu').first().click();
  const menu = page.locator('.js-pop-over .js-change-font');
  await expect(menu).toContainText('Pulizza');
  await menu.click();
  const form = page.locator('.js-pop-over form.change-font');
  await expect(form).toBeVisible();
  await expect(form.locator('.js-ui-font-size-btn[data-size="smaller"]')).toHaveText('Più chjucu');
  await expect(form.locator('.js-ui-font-size-btn[data-size="small"]')).toHaveText('Chjucu');
  await expect(form.locator('.js-ui-font-size-btn[data-size="largest"]')).toHaveText('U più grande');
  await expect(form).not.toContainText('Grandissimo');
});

test('Corsican member preferences explain Enter and multiple-card behavior', async ({ boardPage: page }) => {
  const strings = require('../../../imports/i18n/data/co.i18n.json');
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'co'));
  await page.locator('.js-open-header-member-menu').first().click();
  await page.locator('.js-change-settings').click();
  for (const [selector, key] of [
    ['.js-toggle-submit-on-enter', 'submit-on-enter-description'],
    ['.js-toggle-open-many-cards-at-once', 'open-many-cards-at-once-description'],
  ]) {
    await expect(page.locator(selector)).toHaveAttribute('title', strings[key]);
  }
  await expect(page.locator('.js-toggle-open-many-cards-at-once')).toContainText('Apre parechje carte à tempu');
  await expect(page.locator('.js-toggle-open-many-cards-at-once')).not.toContainText('contemporaneamente');
});
