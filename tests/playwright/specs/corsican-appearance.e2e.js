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
