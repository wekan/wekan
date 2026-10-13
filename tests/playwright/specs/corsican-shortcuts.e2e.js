'use strict';
const { test, expect } = require('../fixtures');
const { navigateInApp } = require('../helpers/auth');
const strings = require('../../../imports/i18n/data/co.i18n.json');

test('Corsican shortcut list translates filter and sidebar actions', async ({ loggedInPage: page }) => {
  await page.evaluate(() => Meteor.callAsync('setLanguage', 'co'));
  await navigateInApp(page, '/shortcuts');
  const entries = page.locator('.shortcuts-list-item');
  for (const key of ['shortcut-clear-filters', 'shortcut-filter-my-cards', 'shortcut-toggle-filterbar', 'shortcut-toggle-searchbar', 'shortcut-toggle-sidebar']) {
    await expect(entries.filter({ hasText: strings[key] })).toHaveCount(1);
  }
  await expect(entries.filter({ hasText: 'Pulisci tutti i filtri' })).toHaveCount(0);
});
